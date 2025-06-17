import ApiFetch from "./api-fetch";
import DomReady from "./dom-ready";
import * as I18n from "./i18n";
import Url from "./url";
import Hooks from "./hooks";
import Date from "./date";

// https://codex.wordpress.org/Javascript_Reference/wp
export default interface WordPress {
    apiFetch: ApiFetch< any >;
    i18n: I18n;
    url: Url;
    hooks: Hooks;
    domReady: DomReady;
    date: Date;
};
