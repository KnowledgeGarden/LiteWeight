## LiteWeight
### A simple platform for UX experiments in Personal and Group Information Elecitation and Organization

* File-based nodes -- JSON strings
* Structured organization of responses to messages
* Rich text
* Web clips: bookmarks with annotations
* Web stash: quick bookmarks without forms
* Public channels
* Private channels
* Participant channels
* Tags
* Crosslinks

### Installation

* Clone this repo (everything is in the master branch)
* npm install

### Configuration and Accounts

Configuration is the /config/config.json file<br/>
Two switches are of importance:

* "isPrivatePortal":false
* "invitationOnly": true

If you want a private portal that requires login (or signup), set isPrivatePortal -> true

If you want an open portal (anyone can signup -- easiest for personal not-online testing), set invitationOnly -> false

Accounts are maintained in /data/accounts/accounts.json

When you clone this repo, that file is filled with lots of test users (fake).

*Suggested installation:*<br/>
* Empty all /data files and folders (don't erase the folders) except inside /data/accounts
* Delete the accounts.json that came with the repo
* Rename accounts_template.json to accounts.json

### Running
* npm start
* visit http://localhost:3000/


