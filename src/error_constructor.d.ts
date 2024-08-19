// Extends the ErrorConstructor interface to include an optional `captureStackTrace` method,
// this is needed for generating declaration files for the library without errors,
// as in some environments this method may not be available.
interface ErrorConstructor {
	captureStackTrace?(targetObject: object, constructorOpt?: Function | undefined): void;
}
