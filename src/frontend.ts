import './frontend.scss';

import apiFetch from './libs/js/wordpress/api-fetch';
import domReady from './libs/js/wordpress/dom-ready';
import wordpressUrl from './libs/js/wordpress/url';
import * as i18n from './libs/js/wordpress/i18n';

// Use the WordPress API so it adds the proper dependencies
domReady; // eslint-disable-line no-unused-expressions
apiFetch; // eslint-disable-line no-unused-expressions
wordpressUrl; // eslint-disable-line no-unused-expressions
i18n; // eslint-disable-line no-unused-expressions
