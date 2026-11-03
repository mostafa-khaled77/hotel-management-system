# Local Notes & TODO: Lean Optimization

## Why We Use `.lean()`

- **Performance & Speed:** Mongoose default queries return heavy hydrated documents with built-in methods and change-tracking. Using `.lean()` returns plain JavaScript objects, which drastically reduces query execution time and CPU load.
- **Memory Efficiency:** Avoids heavy RAM usage by skipping Mongoose document instantiation, ensuring the backend scales smoothly under high traffic.

## The Challenge

- Mongoose's `toJSON` plugin (which automatically converts `_id` to `id` and strips `__v`) **does not work** on `.lean()` objects because they bypass the hydration layer.

## How We Will Implement It

- Create a lightweight mapper/transformer helper function (e.g., `transformLeanDoc`) to process plain objects, converting `_id` to `id` and handling populated fields (`roomId`, `userId`) to maintain a strict, consistent API response contract.
