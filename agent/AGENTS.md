# SchemaForm AI 개발 가이드 (AGENTS.md)

> **목표** – 이 문서는 `SchemaForm` 라이브러리 개발에 참여하는 모든 AI 어시스턴트와 인간 개발자를 위한 온보딩 매뉴얼입니다.
> 라이브러리의 코딩 표준, 설계 원칙, 작업 절차를 명시하여 AI가 효율적으로 기여하고, 인간은 아키텍처, 테스트, 도메인 판단 등 핵심적인 역할에 집중할 수 있도록 돕습니다.
> **Task Master**를 활용하여 프로젝트의 모든 작업을 체계적으로 관리합니다.

---

## 0. 프로젝트 개요

**SchemaForm**은 React 개발자를 위한 스키마 기반 폼(Form) 생성 라이브러리입니다. `react-hook-form`을 핵심 엔진으로 사용하여 안정적인 폼 상태 관리를 제공하고, `zod` 스키마를 통해 데이터 구조와 유효성 검사 규칙을 선언적으로 정의합니다.

핵심은 **어댑터(Adapter) 패턴**을 통해 UI 렌더링 로직을 분리하는 것입니다. 개발자는 `zod` 스키마와 UI 어댑터만 제공하면, `SchemaForm`이 이를 해석하여 지정된 UI 라이브러리(예: MUI, Ant Design)의 컴포넌트로 폼 UI를 자동으로 렌더링합니다. 이를 통해 개발 생산성을 극대화하고, 코드의 일관성과 유지보수성을 높입니다.

**핵심 원칙**: 구현 세부 사항이나 요구사항이 불확실할 경우, 추측하기보다는 항상 개발자에게 질문하여 명확히 해야 합니다.

---

## 1. 필수 준수 원칙 (Golden Rules)

| 번호 | AI가 *수행해도 되는* 작업 | AI가 *절대 수행하면 안 되는* 작업 |
|---|---|---|
| G-1 | 관련 소스 디렉토리(`packages/schemaform-core`, `packages/adapter-*`) 또는 명시적으로 지정된 파일 내에서만 코드를 생성합니다. | ❌ `apps/docs` 내의 Storybook 스토리나 테스트 관련 파일(`*.test.ts`, `*.spec.ts`)을 인간의 감독 없이 수정하거나 생성하지 않습니다. |
| G-2 | 중요하거나 복잡한 코드 수정 시, 근처에 `AIDEV-NOTE:` 주석을 추가하거나 업데이트합니다. | ❌ 기존 `AIDEV-` 주석을 임의로 삭제하거나 핵심 내용을 변경하지 않습니다. |
| G-3 | 프로젝트에 설정된 린팅 및 포맷팅 규칙(`eslint-config`, `typescript-config`)을 따릅니다. | ❌ 개인적인 스타일이나 다른 포맷 규칙으로 코드를 재포맷하지 않습니다. |
| G-4 | 3개 이상의 파일을 수정하거나 300줄 이상의 코드를 변경할 경우, 먼저 계획을 제시하고 개발자의 확인을 받습니다. | ❌ 핵심 아키텍처(예: `<SchemaForm>` 컴포넌트, `UIAdapter` 인터페이스)를 인간의 가이드 없이 리팩토링하지 않습니다. |
| G-5 | 현재 주어진 태스크의 컨텍스트 내에서 작업을 수행합니다. | ❌ "새로운 작업"을 지시받았을 때 이전 프롬프트의 컨텍스트를 이어가지 말고, 새로운 세션에서 시작합니다. |

---

## 2. Task Master 개발 워크플로우

`SchemaForm` 프로젝트는 `Task Master`를 사용하여 모든 작업을 관리합니다. AI 에이전트는 제공된 MCP 도구를 통해 Task Master와 상호작용하는 것이 좋습니다.

### 2.1. 핵심 명령어 (Essential Commands)

| 분류 | 명령어 | 설명 |
|---|---|---|
| **프로젝트 설정** | `task-master init` | 현재 프로젝트에 Task Master 초기 설정 |
| | `task-master parse-prd [file]` | PRD 문서를 분석하여 초기 작업 목록 생성 |
| **일상 개발** | `task-master list` | 모든 작업과 상태 보기 |
| | `task-master next` | 다음에 작업할 태스크 추천 받기 |
| | `task-master show <id>` | 특정 작업의 상세 정보 보기 |
| | `task-master set-status --id=<id> --status=done` | 작업 상태를 '완료'로 변경 |
| **작업 관리** | `task-master add-task --prompt="..."` | AI를 통해 새 작업 추가 |
| | `task-master expand --id=<id>` | 복잡한 작업을 하위 작업으로 분해 |
| | `task-master update-task --id=<id> --prompt="..."` | 특정 작업 내용 업데이트 |
| | `task-master update-subtask --id=<id> --prompt="..."` | 하위 작업에 진행 상황 기록 |
| **의존성 관리** | `task-master add-dependency --id=A --depends-on=B` | B를 A의 선행 작업으로 등록 |
| | `task-master validate-dependencies` | 의존성 오류(순환참조 등) 검사 |

### 2.2. MCP 통합 (권장)

AI 에이전트는 CLI 명령어 대신 MCP(Multi-Context Prompt) 서버를 통해 Task Master 기능을 사용하는 것이 좋습니다. 이는 더 나은 성능과 구조화된 데이터 교환을 제공합니다.

**주요 MCP 도구:**

| MCP Tool | 설명 (CLI 명령어) |
|---|---|
| `initialize_project` | 프로젝트 초기화 (`task-master init`) |
| `parse_prd` | PRD 문서 분석 (`task-master parse-prd`) |
| `get_tasks` | 작업 목록 조회 (`task-master list`) |
| `next_task` | 다음 작업 추천 (`task-master next`) |
| `get_task` | 특정 작업 상세 조회 (`task-master show`) |
| `set_task_status` | 작업 상태 변경 (`task-master set-status`) |
| `add_task` | 새 작업 추가 (`task-master add-task`) |
| `expand_task` | 작업 분해 (`task-master expand`) |
| `update_task` | 작업 업데이트 (`task-master update-task`) |
| `update_subtask` | 하위 작업 업데이트 (`task-master update-subtask`) |

### 2.3. 표준 개발 절차

1.  **초기 설정**:
    -   `initialize_project` 또는 `task-master init`으로 프로젝트를 설정합니다.
    -   `agent/PRD.md` 문서를 기반으로 `parse_prd` 또는 `task-master parse-prd`를 실행하여 초기 작업 목록을 생성합니다.

2.  **일상 개발 루프**:
    -   `next_task` 또는 `task-master next`로 다음에 할 작업을 확인합니다.
    -   `get_task` 또는 `task-master show <id>`로 작업의 세부 요구사항을 파악합니다.
    -   코드를 구현하며 발견한 내용이나 진행 상황을 `update_subtask`를 통해 기록합니다.
    -   작업이 완료되면 `set_task_status`를 사용하여 상태를 `done`으로 변경합니다.

---

## 3. 빌드, 테스트 및 유틸리티 명령어

본 프로젝트는 `pnpm` 워크스페이스와 `Turborepo`를 사용하여 관리됩니다.

```bash
# 전체 의존성 설치
pnpm install

# 문서/예제 사이트(Storybook) 실행
pnpm dev

# 전체 패키지 빌드 (Turborepo 활용)
pnpm build

# 전체 테스트 실행 (Vitest)
pnpm test

# 특정 테스트 파일 실행
pnpm test -- packages/schemaform-core/src/components/SchemaForm.test.ts

# 린트 검사
pnpm lint
```

---

## 4. 코딩 표준

- **언어**: React 19+, TypeScript 5.5+
- **상태 관리**: `react-hook-form` v7+ (핵심 엔진)
- **스키마/유효성 검사**: `Zod` v4+
- **포맷팅**: Prettier + ESLint (공유 설정인 `packages/eslint-config` 참조)
- **타이핑**: 엄격한 타입(Strict)을 지향하며, 모든 API 경계에는 명시적인 타입을 사용합니다.
- **네이밍**: `camelCase`(함수/변수), `PascalCase`(컴포넌트/타입/인터페이스), `SCREAMING_SNAKE_CASE`(상수)
- **문서화**: Storybook(v8+)을 사용하여 각 기능과 옵션에 대한 사용 예시와 API 문서를 명확히 제공합니다.

---

## 5. 프로젝트 구조

### 5.1. 소스 코드 레이아웃

모노레포 구조로 구성되어 있으며, 각 패키지는 명확한 책임을 가집니다.

| 디렉토리/패키지 | 설명 |
|---|---|
| `apps/docs/` | Storybook을 활용한 공식 문서 및 예제 사이트 |
| `packages/schemaform-core/` | 핵심 `<SchemaForm>` 컴포넌트, 훅, 타입 및 렌더링 로직 포함 |
| `packages/adapter-zod/` | `zod` 스키마를 `react-hook-form`이 이해할 수 있도록 변환하는 리졸버 |
| `packages/adapter-mui/` | Material-UI(MUI) 컴포넌트로 폼을 렌더링하는 UI 어댑터 패키지 |
| `packages/eslint-config/` | 모노레포 전체에서 공유하는 ESLint 설정 |
| `packages/typescript-config/` | 공유 TypeScript(`tsconfig.json`) 설정 |

### 5.2. Task Master 파일 구조

```
project/
├── .taskmaster/
│   ├── tasks/              # Task 파일 디렉토리
│   │   ├── tasks.json      # 기본 태스크 데이터베이스
│   │   └── task-1.md       # 개별 태스크 마크다운 파일
│   ├── docs/
│   │   └── prd.txt         # 작업 생성을 위한 요구사항 문서
│   └── config.json         # AI 모델 및 설정
├── .env                    # CLI 사용을 위한 API 키
└── agent/
    └── AGENTS.md           # 이 파일 - 프로젝트 개발 가이드
```

**주요 도메인 모델**:

- **`<SchemaForm>` Component**: 라이브러리의 메인 진입점이자 오케스트레이터. `schema`, `uiAdapter` 등을 `props`로 받아 폼 전체를 관리하고 렌더링합니다.
- **Zod Schema**: `zod`로 정의된 객체. 폼의 데이터 구조, 유효성 검사 규칙, 그리고 `.meta()`를 통한 UI 힌트(label, placeholder 등)를 정의하는 **단일 진실 공급원(SSOT)**입니다.
- **UI Adapter**: 필드 타입을 실제 React 컴포넌트로 매핑하는 객체. UI 라이브러리와의 '다리' 역할을 수행하며, 이를 통해 UI를 쉽게 교체할 수 있습니다.
- **FieldProps Interface**: `UIAdapter` 내의 모든 컴포넌트가 준수해야 하는 `props` 계약. `react-hook-form`의 상태와 스키마 메타데이터를 컴포넌트에 전달합니다.

---

## 6. 앵커 주석 (Anchor Comments)

코드베이스 전반에 걸쳐 AI와 개발자 모두에게 유용한 인라인 지식을 남기기 위해 특별한 형식의 주석을 사용합니다.

### 가이드라인

- AI와 개발자를 대상으로 하는 주석에는 `AIDEV-NOTE:`, `AIDEV-TODO:`, `AIDEV-QUESTION:` 과 같은 대문자 접두사를 사용합니다.
- 간결하게 유지합니다(120자 이하 권장).
- **중요**: 파일을 수정하기 전에 항상 관련 하위 디렉토리에서 `AIDEV-*` 앵커를 먼저 검색하여 기존 컨텍스트를 파악합니다.
- 관련 코드를 수정할 때는 연결된 앵커 주석도 업데이트합니다.
- 인간의 명시적인 지시 없이는 `AIDEV-NOTE`를 삭제하지 않습니다.
- 코드가 길거나, 복잡하거나, 매우 중요하거나, 혼란을 줄 수 있거나, 현재 작업과 관련 없는 버그가 있을 가능성이 있는 경우 관련 앵커 주석을 추가합니다.

예시:

```typescript
// AIDEV-NOTE: 이 유틸리티는 lodash.get과 유사하지만 번들 크기를 줄이기 위해 직접 구현함.
function getByPath(obj: object, path: string) {
  // ...
}
```

---

## 7. 커밋 규칙

- **세분화된 커밋**: 하나의 논리적 변경사항 당 하나의 커밋을 원칙으로 합니다.
- **AI 생성 커밋 태그**: AI가 생성한 커밋에는 메시지 끝에 `[AI]` 태그를 추가합니다. (예: `feat: Add support for custom field layout [AI]`)
- **명확한 커밋 메시지**: "무엇을" 변경했는지보다 "왜" 변경했는지 설명합니다.

---

## 8. 핵심 아키텍처: 어댑터 패턴

- **UI 어댑터 수정**: 새로운 UI 컴포넌트를 지원하거나 기존 컴포넌트의 동작을 변경하려면, 관련 `adapter-*` 패키지(예: `packages/adapter-mui`)를 수정해야 합니다.
- **`UIAdapter` 인터페이스**: 모든 어댑터는 `packages/schemaform-core/src/types.ts`에 정의된 `UIAdapter` 및 `FieldProps` 인터페이스를 준수해야 합니다.
- **`componentType`**: 스키마의 `.meta({ componentType: '...' })`에 정의된 값을 기준으로 어댑터에서 렌더링할 컴포넌트를 선택합니다. 새로운 `componentType`을 추가하려면 어댑터에도 해당 키와 컴포넌트를 추가해야 합니다.

**UI 어댑터 예시 (`adapter-mui/src/index.ts`)**:

```typescript
// packages/adapter-mui/src/index.ts
import { TextField, Checkbox } from '@mui/material';
import type { UIAdapter } from '@schemaform/core';

export const muiAdapter: UIAdapter = {
  string: ({ field, formState, label }) => (
    <TextField
      {...field}
      label={label}
      error={!!formState.errors[field.name]}
      helperText={formState.errors[field.name]?.message as string}
    />
  ),
  boolean: ({ field, label }) => (
    // ... Checkbox implementation
  ),
  // 'password' 타입은 'string'과 다른 UI를 렌더링
  password: ({ field, ...props }) => (
    <TextField
      {...field}
      {...props}
      type="password"
    />
  ),
  // ...
};
```

---

## 9. 제어(Controlled) vs 비제어(Uncontrolled) 모드

- **비제어 모드 (기본)**: `<SchemaForm>`에 `schema`만 전달하면, 컴포넌트가 내부적으로 `useForm`을 호출하여 모든 상태를 직접 관리합니다. 가장 간단한 사용 방식입니다.
- **제어 모드**: 외부에서 생성한 `useForm`의 `control` 객체를 `<SchemaForm>`에 `prop`으로 주입할 수 있습니다. 이를 통해 폼 상태를 상위 컴포넌트에서 직접 제어하고 다른 상태와 연동할 수 있습니다.
- **`control` prop이 전달되면, `<SchemaForm>`은 내부 `useForm` 초기화 로직을 건너뜁니다.** `defaultValues`, `resolver` 등은 모두 외부 `useForm`에서 설정해야 합니다.

```typescript
// 제어 모드 예시
function MyAdvancedForm() {
  const { control, handleSubmit, watch } = useForm({
    resolver: zodResolver(mySchema),
    defaultValues: { name: '초기값' },
  });

  const currentName = watch('name');

  return (
    <SchemaForm
      control={control} // 외부 control 객체 주입
      schema={mySchema} // 렌더링을 위해 스키마는 여전히 필요
      uiAdapter={muiAdapter}
      onSubmit={handleSubmit(data => console.log(data))}
    />
  )
}
```

---

## 10. 테스트 프레임워크 (Vitest)

- `packages` 내의 `*.test.ts` 또는 `*.test.tsx` 패턴을 가진 파일들이 테스트 대상입니다.
- 테스트는 실제 `zod` 스키마와 Mock UI 어댑터를 사용하여 다양한 렌더링 및 인터랙션 시나리오를 검증합니다.
- `React Testing Library`를 사용하여 컴포넌트가 사용자의 관점에서 올바르게 동작하는지 테스트합니다.

---

## 11. `AGENTS.md` 파일 관련 규칙

- 특정 패키지(`packages/*`) 내에서 작업을 시작하기 전에, 해당 디렉토리에 `AGENTS.md` 파일이 있는지 확인합니다. (존재할 경우, 해당 파일의 컨텍스트를 우선적으로 따릅니다.)
- 패키지의 구조나 핵심 로직에 중요한 변경을 가했다면, 해당 내용을 그 디렉토리의 `AGENTS.md`에 문서화하는 것을 제안합니다.

---

## 12. 흔한 실수 및 주의사항

- **잘못된 모드 사용**: 외부에서 폼 상태를 제어해야 할 때 `control` prop을 전달하지 않거나, 간단한 폼에 불필요하게 제어 모드를 사용하는 경우.
- **어댑터와 스키마 불일치**: 스키마의 `meta.componentType`에 정의된 값을 처리하는 컴포넌트가 `UIAdapter`에 존재하지 않는 경우.
- **`onSubmit` 핸들러 래핑**: 제어 모드에서 `<SchemaForm>`의 `onSubmit`에 전달하는 함수를 외부 `handleSubmit`으로 감싸는 것을 잊는 경우.
- **`core` 패키지 직접 수정**: 새로운 UI 동작을 추가할 때, 새로운 어댑터를 만들거나 기존 어댑터를 확장하는 대신 `schemaform-core`를 직접 수정하려는 시도.

---

## 13. 버전 관리

- 각 패키지는 `package.json`에서 독립적으로 버전을 관리하며, Semantic Versioning(SemVer)을 따릅니다.
- `pnpm`의 워크스페이스 기능을 통해 버전 관리가 이루어집니다. 릴리즈는 `changesets`와 같은 도구를 활용할 수 있습니다.

---

## 14. 주요 파일 및 패턴 참조

- **`<SchemaForm>` 컴포넌트**:
  - 위치: `packages/schemaform-core/src/components/SchemaForm.tsx`
- **핵심 타입 및 인터페이스**:
  - 위치: `packages/schemaform-core/src/types.ts` (`UIAdapter`, `FieldProps`, `FieldMetadata` 등)
- **MUI 어댑터 구현 예시**:
  - 위치: `packages/adapter-mui/src/index.ts`
- **스키마 메타데이터 활용**:
  - 패턴: `z.string().meta({ label: '이름', componentType: 'password' })` 와 같이 `meta()`를 사용하여 UI 힌트를 스키마에 직접 정의합니다.
- **필드 레이아웃 커스터마이징**:
  - 패턴: `<SchemaForm renderFieldLayout={...} />` prop을 사용하여 레이블, 입력 필드, 에러 메시지의 전체 구조를 커스터마이징합니다.

---

## 15. 도메인 특화 용어

- **SchemaForm**: 라이브러리 자체 또는 최상위 `<SchemaForm>` 컴포넌트.
- **Schema (스키마)**: `zod`로 정의된 객체. 폼의 데이터 구조, 유효성 검증, UI 메타데이터를 포함하는 단일 진실 공급원.
- **UI Adapter (UI 어댑터)**: `componentType`을 키로, React 컴포넌트를 값으로 갖는 객체. `SchemaForm`의 렌더링 로직과 실제 UI 구현을 분리하는 '다리'.
- **Field (필드)**: 폼을 구성하는 각각의 입력 요소 (예: 이름, 이메일, 비밀번호 필드). 스키마의 각 키에 해당합니다.
- **`meta`**: Zod 스키마의 `.meta()` 함수를 통해 주입되는 UI 렌더링을 위한 메타데이터 객체 (`label`, `placeholder`, `componentType` 등).
- **`componentType`**: `meta` 객체 내의 문자열 키. `UIAdapter`가 어떤 UI 컴포넌트를 렌더링할지 결정하는 데 사용됩니다 (예: `'password'`, `'textarea'`).
- **`renderFieldLayout`**: 필드의 전체 레이아웃(레이블, 입력, 에러 메시지 등)을 사용자가 직접 정의할 수 있도록 하는 `<SchemaForm>`의 함수형 prop.
- **Controlled Mode (제어 모드)**: 외부에서 생성한 `react-hook-form`의 `control` 객체를 주입하여 폼의 상태를 상위 컴포넌트에서 직접 관리하는 사용 방식.
- **Uncontrolled Mode (비제어 모드)**: `<SchemaForm>`이 내부적으로 `react-hook-form` 인스턴스를 생성하고 상태를 모두 관리하는 기본 사용 방식.
