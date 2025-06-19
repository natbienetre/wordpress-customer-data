=== Customer Data ===
Contributors: holyhope
Donate link: https://github.com/holyhope/wordpress-customer-data
Tags: storage, swift, file upload, customer data
Requires at least: 5.8
Tested up to: 6.7.2
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A WordPress plugin that provides a data management for visitors based on OpenStack Swift storage.
It allows authenticated visitors to upload files, download and delete files.
It also allows administrators to manage the files and the authentication tokens.

== Description ==

Customer Data is a WordPress plugin that enables secure file storage and management using OpenStack Swift storage. It provides a robust solution for handling customer data with features like:

* Secure file upload and storage
* Temporary URL generation for file access
* File preview capabilities
* File deletion functionality
* File download management
* User-specific storage spaces

The plugin integrates seamlessly with WordPress and provides a user-friendly interface for both administrators and users.

== Installation ==

1. Upload the `customer-data` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to the Customer Data settings page and configure your Swift storage credentials:
   * Swift Base URL
   * Container name
   * Additional prefix (optional)
   * Signature algorithm
   * Secret key

== Frequently Asked Questions ==

= What is OpenStack Swift? =

OpenStack Swift is a highly available, distributed, eventually consistent object/blob store. It's commonly used for storing large amounts of unstructured data.

= Why a full client side solution? =

The plugin uses a full client side solution to manage the files.
It allows users to directly interact with the storage bypassing the webserver's proxy.
That way, the webser load remains light, the user experience is better and the storage is more secure.

= How secure is the file storage? =

The plugin uses temporary URLs with HMAC signatures for file access, ensuring secure and time-limited access to stored files.

= Can I customize the storage configuration? =

Yes, you can configure various aspects of the storage system including the base URL, container name, and additional prefixes.

== Screenshots ==

1. CustomerData Settings Page - Configure your Swift storage credentials
2. File Upload Block - Upload files directly from your WordPress content
3. File Preview - Preview uploaded files in the editor
4. File Management - Manage file access and permissions

== Changelog ==

= 1.0.1 =
* Add Automator workflow to generate the authentication token
* Add a block to upload files
* Add a block to preview files
* Add a block to manage files

= 1.0.0 =
* Initial release
* File upload functionality
* File preview capabilities
* File deletion support
* Temporary URL generation
* User-specific storage spaces

== Upgrade Notice ==

= 1.0.0 =
Initial release of the CustomerData plugin, providing secure file storage using OpenStack Swift.
