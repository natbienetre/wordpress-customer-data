export type __ = ( string: string, domain: string ) => string;
export type _n = (
	string: string,
	string2: string,
	number: number,
	domain: string
) => string;
export type _nx = (
	string: string,
	string2: string,
	number: number,
	context: string,
	domain: string
) => string;
export type _x = ( string: string, context: string, domain: string ) => string;
export type sprintf = ( string: string, ...args: any[] ) => string;

export default interface I18n {
	__: __;
	_n: _n;
	_nx: _nx;
	_x: _x;
	sprintf: sprintf;
}
