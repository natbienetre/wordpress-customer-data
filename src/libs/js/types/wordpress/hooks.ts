export type DoAction = (
	hookName: string,
	...args: unknown[]
) => undefined | unknown;
export type DoActionAsync = (
	hookName: string,
	...args: unknown[]
) => undefined | unknown;
export type ApplyFilters = (
	hookName: string,
	...args: unknown[]
) => undefined | unknown;
export type ApplyFiltersAsync = (
	hookName: string,
	...args: unknown[]
) => undefined | unknown;
export type AddHook = (
	hookName: string,
	namespace: string,
	callback: ( ...args: any[] ) => any,
	priority?: number | undefined
) => any;
export type RemoveHook = (
	hookName: string,
	namespace: string
) => number | undefined;
export type HasHook = (
	hookName: string,
	namespace?: string | undefined
) => boolean;

export type DidHook = ( hookName: string ) => number | undefined;

interface Hooks {
	addAction: AddHook;
	addFilter: AddHook;
	removeAction: RemoveHook;
	removeFilter: RemoveHook;
	hasAction: HasHook;
	hasFilter: HasHook;
	doAction: DoAction;
	doActionAsync: DoActionAsync;
	applyFilters: ApplyFilters;
	applyFiltersAsync: ApplyFiltersAsync;
	didAction: DidHook;
	didFilter: DidHook;
}

export default Hooks;
