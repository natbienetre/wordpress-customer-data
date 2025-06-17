/**
 * Sidebar registration
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This script registers the VFS sidebar in the WordPress editor.
 */

import { enable as enableTokenVisibility } from './token-visibility';
import { enable as enableTemporaryUrl } from './temp-url';
import { enable as enableTokenCreation } from './token-creation';
import { enable as enableTokenValidation } from './token-validation';
import { enable as enableJWKS } from './jwks';

enableTokenVisibility();
enableTemporaryUrl();
enableTokenCreation();
enableTokenValidation();
enableJWKS();
