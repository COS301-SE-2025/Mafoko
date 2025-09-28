// frontend/src/setupTests.ts

import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import 'fake-indexeddb/auto';

// Add this to provide TextEncoder/TextDecoder to the test environment
(global as unknown as { TextEncoder: typeof TextEncoder }).TextEncoder =
  TextEncoder;
(global as unknown as { TextDecoder: typeof TextDecoder }).TextDecoder =
  TextDecoder;

// Mock indexedDB is automatically provided by 'fake-indexeddb/auto'
