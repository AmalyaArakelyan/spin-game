// images.d.ts or global.d.ts

// This declaration tells TypeScript that any import ending with
// these extensions should be treated as a module that exports a string.
declare module '*.png' {
    const value: string;
    export default value;
}

// Optional: Add other image types you might use
declare module '*.jpg' {
    const value: string;
    export default value;
}

declare module '*.svg' {
    const value: string;
    export default value;
}
