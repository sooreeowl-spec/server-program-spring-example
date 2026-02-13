# Koreanit Server Program - Spring Backend API

Spring Boot 기반의 **세션 인증 REST API 백엔드 포트폴리오 프로젝트**입니다.  
Users / Posts / Comments 도메인을 중심으로, 실제 서비스 운영을 고려한 구조(계층 분리, 공통 응답, 에러 표준화, 보안, 로깅)를 구현했습니다.

---

## 1. 프로젝트 요약

- **목표**: 단순 CRUD를 넘어서, 실무형 백엔드 구조와 운영 관점을 반영한 API 서버 구현
- **핵심 포인트**
  - Controller → Service → Repository 계층 분리
  - Entity → Domain → DTO 분리
  - 세션 기반 인증 + Spring Security 인가 처리
  - 공통 응답 포맷 및 전역 예외 처리
  - Access Log Filter 기반 요청 로깅
  - Redis 기반 세션 저장소 구성 가능

---

## 2. 기술 스택

- **Language**: Java 17
- **Framework**: Spring Boot 3.5.10
- **Security**: Spring Security (Session Authentication)
- **Validation**: Jakarta Validation
- **Data Access**: JDBC, JdbcTemplate
- **Database**: MySQL
- **Session Store**: Redis (Spring Session)
- **Build Tool**: Gradle

---

## 3. 아키텍처 / 요청 흐름

```text
Client
  → AccessLogFilter
  → Security Filter Chain (SessionAuthenticationFilter)
  → Controller
  → Service
  → Repository (JdbcTemplate)
  → MySQL
```

### 계층 책임

- **Controller**: HTTP 요청/응답 처리, DTO 변환
- **Service**: 비즈니스 규칙, 검증, 권한/정책 처리
- **Repository**: DB 접근 및 쿼리 실행

---

## 4. 주요 기능

### User
- 회원가입
- 로그인/로그아웃(세션)
- 내 정보 조회(`/api/me`)
- 사용자 조회/수정/삭제

### Post
- 게시글 생성/목록/상세/수정/삭제
- 게시글 목록 페이징(`page`, `limit`)

### Comment
- 댓글 생성/목록/삭제
- 게시글 단위 댓글 조회

---

## 5. 보안 및 예외 처리

### 인증/인가
- 인증 실패: **401 Unauthorized**
- 권한 부족: **403 Forbidden**
- JSON 에러 응답으로 일관성 있게 반환

### 에러 코드 표준화
- `INVALID_REQUEST` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND_RESOURCE` (404)
- `DUPLICATE_RESOURCE` (409)
- `INTERNAL_ERROR` (500)

### 공통 응답
- 성공/실패를 동일 포맷으로 반환 (`ApiResponse`)
- `GlobalExceptionHandler`에서 예외를 공통 처리

---

## 6. API 요약

### Auth
- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`

### Users
- `POST /api/users`
- `GET /api/users`
- `GET /api/users/{id}`
- `PUT /api/users/{id}/nickname`
- `PUT /api/users/{id}/password`
- `PUT /api/users/{id}/email`
- `DELETE /api/users/{id}`

### Posts
- `POST /api/posts`
- `GET /api/posts`
- `GET /api/posts/{id}`
- `PUT /api/posts/{id}`
- `DELETE /api/posts/{id}`

### Comments
- `POST /api/posts/{postId}/comments`
- `GET /api/posts/{postId}/comments`
- `DELETE /api/comments/{id}`

> 테스트 요청 예시는 `.apitest/users.http`, `.apitest/posts.http`에 정리되어 있습니다.

---

## 7. 실행 방법

## 7-1. 사전 준비
- Java 17+
- MySQL 실행
- Redis 실행(세션 저장 사용 시)

## 7-2. 개발 환경 실행 (dev profile 기본)

`src/main/resources/application-dev.yml` 기준으로 DB/Redis를 맞춘 뒤:

```bash
./gradlew bootRun
```

## 7-3. 운영 환경 실행 (prod)

환경변수 설정 예시:

```bash
export PORT=8080
export DB_URL='jdbc:mysql://localhost:3306/koreanit_service?serverTimezone=Asia/Seoul&characterEncoding=utf8'
export DB_USER='koreanit_app'
export DB_PASSWORD='password'
export REDIS_HOST='127.0.0.1'
export REDIS_PORT='6379'
```

실행:

```bash
./gradlew bootJar
java -jar build/libs/spring-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

---

## 8. 포트폴리오에서 강조한 점

1. 단순 기능 구현이 아니라 **구조적 설계(계층/타입 분리)**를 적용
2. 인증/인가/예외를 **HTTP 상태코드 관점으로 표준화**
3. 공통 응답/로깅 등 **운영 친화적 백엔드 기본기**를 반영
4. API 테스트 시나리오를 별도 파일로 관리해 재현 가능성 확보

---

## 9. 향후 개선 계획

- API 문서화(Swagger/OpenAPI)
- 통합 테스트/보안 테스트 보강
- Docker 기반 실행 환경 표준화
- CI/CD 파이프라인 구축

---

## 10. 프로젝트 한 줄 소개

> "Spring Boot + Security + JDBC 기반으로, 인증/인가/예외/공통응답까지 포함한 실무형 백엔드 API 서버를 설계·구현한 포트폴리오 프로젝트"
