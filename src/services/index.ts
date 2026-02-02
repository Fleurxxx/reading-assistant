/**
 * Services module exports
 * Main entry point for all translation-related services
 */

// Export test utilities for development and debugging
export * from "./testUtils";
export type {
  ApiCredentials,
  TranslationAdapter,
} from "./translationAdapter";
export {
  TranslationError,
  TranslationErrorCode,
} from "./translationAdapter";
export { TranslationCacheService, translationCache } from "./translationCache";
export { TranslationService, translateText, translationService } from "./translationService";
export { YoudaoTranslator, youdaoTranslator } from "./youdaoTranslator";
