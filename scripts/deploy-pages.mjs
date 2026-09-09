/**
 * 로컬 빌드 → gh-pages 브랜치 푸시.
 *
 * 이 저장소가 올라가 있는 GitHub Enterprise Server 인스턴스는 Actions 가
 * 비활성이라(워크플로가 등록조차 되지 않음) CI 로 빌드할 수 없다.
 * 그래서 배포는 로컬에서 빌드해 결과물만 gh-pages 브랜치로 올리는 방식이다.
 *
 *   npm run deploy
 *
 * 나중에 Actions 가 열리면 .github/workflows/deploy-pages.yml 로 대체할 수 있다.
 *
 * git worktree 를 쓰는 이유: 현재 작업 트리를 건드리지 않고 gh-pages 브랜치를
 * 별도 디렉터리에 체크아웃해 다루기 때문에, 배포 중 소스가 오염되지 않는다.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BRANCH = 'gh-pages';
const DIST = 'dist';

function git(args, options = {}) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: 'pipe', ...options }).trim();
}

/**
 * 빌드를 실행한다.
 *
 * npm 을 거치지 않고 vite 진입점을 현재 Node 로 직접 실행한다.
 * Windows 의 npm 은 npm.cmd 이고, Node 18 이후 보안 제약으로 .cmd/.bat 은
 * shell: true 없이 실행할 수 없다. 그런데 shell: true 로 인자를 넘기면
 * 이스케이프 없이 이어붙어 DEP0190 경고가 난다. 양쪽을 다 피하려면
 * 스크립트 파일을 직접 지목하는 편이 낫고, PATH 에 npm 이 없어도 동작한다.
 */
function runBuild() {
  // package.json 의 build 스크립트와 동일하게 타입 검사를 먼저 통과시킨다.
  // 검사를 건너뛰면 타입 오류가 있는 코드가 그대로 배포된다.
  const steps = [
    { name: '타입 검사', bin: join('node_modules', 'typescript', 'bin', 'tsc'), args: ['-b'] },
    { name: '번들 빌드', bin: join('node_modules', 'vite', 'bin', 'vite.js'), args: ['build'] },
  ];

  for (const step of steps) {
    if (!existsSync(step.bin)) {
      console.error(`${step.name} 실행 파일을 찾을 수 없습니다: ${step.bin}`);
      console.error('먼저 npm install 을 실행하세요.');
      process.exit(1);
    }
    execFileSync(process.execPath, [step.bin, ...step.args], { stdio: 'inherit' });
  }
}

// 1) 커밋되지 않은 변경이 있으면 멈춘다.
//    배포본과 저장소 상태가 어긋나면 "무엇이 올라갔는지" 추적할 수 없다.
const dirty = git(['status', '--porcelain']);
if (dirty) {
  console.error('커밋되지 않은 변경이 있습니다. 커밋하거나 되돌린 뒤 다시 실행하세요.\n');
  console.error(dirty);
  process.exit(1);
}

const sourceSha = git(['rev-parse', '--short', 'HEAD']);
const sourceBranch = git(['rev-parse', '--abbrev-ref', 'HEAD']);

console.log(`\n[1/4] 빌드 (${sourceBranch} @ ${sourceSha})`);
runBuild();

if (!existsSync(DIST) || readdirSync(DIST).length === 0) {
  console.error(`빌드 산출물이 없습니다: ${DIST}/`);
  process.exit(1);
}

console.log(`\n[2/4] ${BRANCH} 브랜치 worktree 준비`);
const worktree = mkdtempSync(join(tmpdir(), 'gh-pages-'));
// mkdtemp 가 만든 빈 디렉터리는 worktree add 가 거부하므로 지우고 넘긴다.
rmSync(worktree, { recursive: true, force: true });

// 지난 실행이 비정상 종료해 남은 worktree 등록 정보를 정리한다.
git(['worktree', 'prune']);

/*
 * worktree 를 detached HEAD 로 만든다.
 *
 * 로컬 gh-pages 브랜치를 체크아웃하면, 그 브랜치가 다른 worktree 에 이미
 * 체크아웃돼 있을 때 git 이 거부한다("refusing to fetch into branch ...
 * checked out at ..."). detached 로 두고 마지막에 HEAD 를 원격 브랜치로
 * 푸시하면 로컬 브랜치 ref 를 아예 쓰지 않으므로 그 충돌이 발생하지 않는다.
 */
const remoteHasBranch = git(['ls-remote', '--heads', 'origin', BRANCH]).length > 0;
if (remoteHasBranch) {
  git(['fetch', 'origin', BRANCH]);
  git(['worktree', 'add', '--detach', worktree, `origin/${BRANCH}`]);
} else {
  git(['worktree', 'add', '--orphan', '-b', `${BRANCH}-tmp-${Date.now()}`, worktree]);
}

try {
  console.log(`\n[3/4] 산출물 복사`);
  // 이전 배포본을 지운다. .git 은 worktree 연결 파일이라 건드리지 않는다.
  for (const entry of readdirSync(worktree)) {
    if (entry === '.git') continue;
    rmSync(join(worktree, entry), { recursive: true, force: true });
  }
  cpSync(DIST, worktree, { recursive: true });

  console.log(`\n[4/4] 커밋 & 푸시`);
  git(['add', '-A'], { cwd: worktree });

  const changed = git(['status', '--porcelain'], { cwd: worktree });
  if (!changed) {
    console.log('변경 사항이 없습니다. 푸시를 건너뜁니다.');
  } else {
    git(['commit', '-m', `Deploy: ${sourceBranch} @ ${sourceSha}`], { cwd: worktree });
    // HEAD 를 원격 브랜치로 직접 푸시한다. 로컬 브랜치 ref 를 쓰지 않는다.
    git(['push', 'origin', `HEAD:refs/heads/${BRANCH}`], { cwd: worktree });
    console.log(`\n${BRANCH} 브랜치에 배포했습니다. (source ${sourceSha})`);
  }
} finally {
  git(['worktree', 'remove', '--force', worktree]);
}

console.log(
  [
    '',
    '주의: 이 인스턴스의 Pages 빌더가 동작하지 않으면 브랜치를 올려도',
    '사이트는 "Site not found" 를 반환합니다. README 의 "배포" 절을 참고하세요.',
    '',
  ].join('\n'),
);
