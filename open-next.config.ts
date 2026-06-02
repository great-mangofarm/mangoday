import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// 첫 배포: 추가 인프라(R2/KV) 없이 배포된 정적 에셋에서 캐시를 읽는다.
// 런타임 ISR 쓰기-백이 필요해지면 r2-incremental-cache 로 교체.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
