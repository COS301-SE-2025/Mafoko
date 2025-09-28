// frontend/src/setupTests.ts

import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import 'fake-indexeddb/auto';

// Add this to provide TextEncoder/TextDecoder to the test environment
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Mock indexedDB is automatically provided by 'fake-indexeddb/auto'
