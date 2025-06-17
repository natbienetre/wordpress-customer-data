=== VFS ===
Contributors: holyhope
Donate link: https://github.com/holyhope/wordpress-customer-data
Tags: storage, swift, file upload, customer data, virtual file system
Requires at least: 5.8
Tested up to: 6.7.2
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A WordPress plugin that provides a virtual file system using OpenStack Swift storage for customer data management.

== Description ==

VFS (Virtual File System) is a WordPress plugin that enables secure file storage and management using OpenStack Swift storage. It provides a robust solution for handling customer data with features like:

* Secure file upload and storage
* Temporary URL generation for file access
* File preview capabilities
* File deletion functionality
* File download management
* User-specific storage spaces

The plugin integrates seamlessly with WordPress and provides a user-friendly interface for both administrators and users.

== Installation ==

1. Upload the `vfs` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to the VFS settings page and configure your Swift storage credentials:
   * Swift Base URL
   * Container name
   * Additional prefix (optional)
   * Signature algorithm
   * Secret key

== Frequently Asked Questions ==

= What is OpenStack Swift? =

OpenStack Swift is a highly available, distributed, eventually consistent object/blob store. It's commonly used for storing large amounts of unstructured data.

= How secure is the file storage? =

The plugin uses temporary URLs with HMAC signatures for file access, ensuring secure and time-limited access to stored files.

= Can I customize the storage configuration? =

Yes, you can configure various aspects of the storage system including the base URL, container name, and additional prefixes.

== Screenshots ==

1. VFS Settings Page - Configure your Swift storage credentials
2. File Upload Block - Upload files directly from your WordPress content
3. File Preview - Preview uploaded files in the editor
4. File Management - Manage file access and permissions

== Changelog ==

= 1.0.0 =
* Initial release
* File upload functionality
* File preview capabilities
* File deletion support
* Temporary URL generation
* User-specific storage spaces

== Upgrade Notice ==

= 1.0.0 =
Initial release of the VFS plugin, providing secure file storage using OpenStack Swift.
