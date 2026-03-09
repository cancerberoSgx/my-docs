# prompt 1

Please create a fullstack application. This folder will contain two sub folders backend and frontend.

Backend project:
 * separate project in /backend folder
 * node.js express based REST API. 
 * uses json-web-token for authentication
 * Use typescript.

Backend database 
 * it uses sqlite local file db
 * I can write sql migrations in separate files in a "migrations" folder

Backend first task
 * create a db table would be "users" with columns: id (pk), email (unique), password, role (string)
 * there's a default user 
 * create a "documents" table associated to the "users" table with columns id (pk), userId (fk), url, platform(string)
 * create a POST /auth endpoint which accept {email, password} and return an authentication header (json web token) 
 * create a POST /register to create a new account. It accepts email and password and errs if email already taken. If success it creates a new record in users table
 * create a get /documents which return a list of documents of the user identifying by authentication header. It returns 401 if no authentication is given or user doesn't exists.


Frontend project:

 * separate project in /frontend folder
 * react, react-dom
 * uses typescript
 * use DaisyUI for styles
 * uses zustand for app state
 * mobile first design

Frontend first task

 * the user must be able to create a new account calling POST /register if they don't have an account
 * user session must be remembered somehow using local storage after they register
 * if user's session expire they can login using POST /auth method
 * when the user is logged in they see the list of documents calling POST /documents


## Response

Everything works. Here's a summary of what was built:                                                                                                                                
                                                                                                                                                                                       
  ---                                                                                                                                                                                  
  Project Structure                                                                
                                                                                                                                                                                       
  my-youtube/                                                                                                                                                                        
  ├── backend/                                                                                                                                                                         
  │   ├── src/                                                                                                                                                                         
  │   │   ├── index.ts          # Express app entry point                                                                                                                              
  │   │   ├── db.ts             # SQLite (node:sqlite) + migration runner                                                                                                              
  │   │   ├── auth.ts           # JWT sign/verify + requireAuth middleware                                                                                                             
  │   │   └── routes/                                                                                                                                                                  
  │   │       ├── authRoutes.ts     # POST /auth, POST /register
  │   │       └── documentRoutes.ts # GET /documents
  │   ├── migrations/
  │   │   ├── 001_create_users.sql
  │   │   └── 002_create_documents.sql
  │   ├── package.json
  │   └── tsconfig.json
  └── frontend/
      ├── src/
      │   ├── main.tsx
      │   ├── App.tsx            # Routes: AuthForm | DocumentList
      │   ├── store.ts           # Zustand store (token persisted via localStorage)
      │   ├── api.ts             # fetch wrappers for all endpoints
      │   └── components/
      │       ├── AuthForm.tsx   # Login/Register toggle form
      │       └── DocumentList.tsx # Documents view + sign out
      ├── index.html
      ├── vite.config.ts         # Proxy /auth,/register,/documents → :3001
      ├── tailwind.config.js
      └── package.json

  To run

  Backend (port 3001):
  cd backend && npm run dev

  Frontend (port 3000):
  cd frontend && npm run dev

  Notes

  - Uses Node's built-in node:sqlite (Node 22.5+) — no native compilation needed
  - Default admin: admin@example.com / password
  - JWT tokens expire in 7 days; stored in localStorage via Zustand persist
  - Migrations run automatically on startup; add new .sql files to migrations/ to extend the schema
  - Set JWT_SECRET env var in production




# prompt 2

Create frontend/README.md and backend/README.md with project use instructions
Add gitignore file in both projects


# prompt 3

implement: users are able add new documents. 

# prompt 4

users can have multiple document lists. 
 * Create a "lists" db table with columns name and description, createdAt, updatedAt. and userId (pk) which is associated with a user and a relationship 
 * create table lists_documents which associate list with documents
 * POST /documents now convert to post /lists/{listId}/documents
 * GET /documents now converts to GET /lists/{listId}
 + every user (new users) has a "default" list by default
 * Users are able to see their document lists, filter them by name and order by name, createdAt, updatedAt
 * users are able to edit their document lists
 * users are able to delete their document lists with the exception of the "default" one


# prompt: 

change all backend API routes to /api, example, /api/auth, /api/list, etc


# prompt: 

/api/auth endpoints works ok but /api/lists is not and returns static index.html. Can you fix it ? probably install all endpoints in same router instance ? 

# prompt

remove everything related to documentRoutes in code, endpoints and frontend


# prompt

in /backend
migrate sqlite to postgres
use docker for local development so there's sh command that starts a postgres server so I can `npm run dev`ç


# prompt

New feature: document type
there's a new "type" column in "documents" table . A document could be just a web page, an uploaded document, a youtube vide taken from its url, an mcp server, etc. 
When user creates or view a document the document type is shown together with it icon
document type is inferred by the backend in an endpoint get /documentType?url=docUrl . if domain is youtube.com it returns "youtube" if not it returns "unknown"
Implement the "youtube" document type and store/serve the youtubeImage favicon as static asset in the /frontend project
when creating a new document the frontend first calls this endpoint before user can hit "save" so the type is displayed to the user before it's saved

# prompts routes

use a library like react-router or recommend one so each screen has its own url. So I can share with others urls of:
 * my lists
 * a particular list of documents


# prompt apidocs

in backend, pick the right library so we can generate API reference documentation. there's a npm run apidocs script that generates HTML version of api 
docs. Serve this HTML in /apidocs endpoint


# prompt backend-architecture

in backend, instead of implementing everything in the routes I want the following architecture (example for "lists"): 
listsRoutes -> takes care of validating parameters and user permissions
listsService -> manage the logic, for example calling listsRepository.get()
listsRepository -> manage database access. Contains the DB typescript types




# prompt: api integration tests

I need to have backend API integration tests that for example, create users, lists, documents and check for permissions, services etc. Can you implement this with this first tests ? : 
 * tests must be all under /test folder
 * authTest: user can register, unique email registration, user can login (obtain auth header)
 * listTest: register new user
  * user can create list, list the list testing sorting and filtering, delete list
  * user can add documents to a list
  * delete user on test finish



ideas / future:

# prompt: document page

add the following features about documents:

 * description text optional
 * type (one of youtube, webpage )
 * type_image text optional
  * when document is created, the frontend needs to send the type_image path inferred
* UI: tjhere's an add-document "+" button that asks for url, description and shows the document type feedback in a modal or a separate document-edit-page
* in the doc lists when I click a document I'm taken to that document document-edit page where I can see doc info or edit it.
* the document-page must have a shareable url

# prompt: document page test

implement tests for new endpoints GET /documents/:docId 


# prompt:  yt-streamer
Can you create a .d.ts file defining types of library yt-streamer as used in  backend/src/integrations/youtube/index.ts  so I don't have ts errors ? 



future:

# prompt document status

documents have status and the status flow depends on its type

for example, web page documents are always "ready" because they are just an url users can open

youtube document types are different. Their status are "empty" at the begnining. Only when user calls PUT /document/:documentId/status they can call action "load" which will calls an  async process that downloads and prespare content into an accessible url. 

User can check the status using polling to GET /document/:documentId/status

valid status: 

empty
ready
pending
error

Tasks:
implement this for youtube doc type
add necessary db columns for status (text) and statusChangeError(text or NULL)
update documents endpoints to return status and statusChangeError
Show the status in the document-page
in the list page, documents can be filtered by status 
in the document page, there's a "prepare" button which triggers PUT /document/:documentId/status {action:"load"}
by default all youtube documents status are in "empty"
in backend, implement a dummy status manager for youtube type which triggers an async function that first sets the status to "pending" and after 10 seconds changes to "ready"
if the status change handler fails, we store exception msg in a new  statusChangeError text column. If it does not fail, we empty that column


# prompt document status history

get status operation returns an object like:
{
  url: string
  mimetype: string
  extra: arbitrary-json-object
}
in general types like youtube will result on a url to play the video and mimetype but in extra other type integrations could return more info

each time a document status change, we want to store this result in an associated db table documentStatusHistory with columns:
id: (pk) 
documentId (fk)
status: status-str
createdAt: timestamp
resolved_url: string
resolved_mimetype: string
resolved_extra: jsonb


# prompt: documents routes

 from listRoutes backend, move all methods hitting /documents* to a new route documentsRoutes

# prompt: re-prepare youtube documents

in the UI even if it's "ready" user can post a "load" action again

# prompt use enums 

move all hardcoded enums like document status to enums instead of using hardcoded  both in backend and frontend projects and tests

# prompt list filter by type
in the lists document page, implement filter by type. 
Also make sure filters UI is well extructured and expandable for mobile usage so we can add more without visual problems


# prompt . ui menu
add a menu for settings, account, docs, etc
mobile first swith icons instead of labels
menus: 
 * session ->   
   * log out if logged in
   * login if no session
   * register if no sessions
 * settings ->
    * account: let the user see their account information, and change the password and delete account
    * settings -> settings navigate to an empty settings screen
 * Docs ->
   * dummy links to home page, about us, 
   * link to apidocs


# prompt: user role

 * there are two user roles: "user" and "root"
  * current "admin" role must be migrated to "root". Also create a new user user@test.com pssword: 1234 in db with role "user"
  * in backend we want to check for user role permissions on each operation. It should be an easy to use middleware to check for user+root or root-only permissions on each endpoint
  * user role is displayed in the account / user screen and can be change only by root user (read only) - by default users are "user" role
  * save the roles in enum both front and back
  * user can see and edit only their lists, documents, user-profile. 
  * root can see any user's profile, list and documents and also edit changes on all.
  * root can see an extra menu and screens:
    * menu root -> users: display a list of users (html data-table), with pagination (limit and offset params), orderBy creation date, email, role root and filter by email (implement api endpoint - only root)
    * menu root -> documents  display a list (html data-table) which contains all documents , with pagination (limit and offset params), orderBy creation date, url, type filter by url and type  (implement api endpoint - only root)
    * menu root -> lists:   display a list (html data-table) which contains all documents , with pagination (limit and offset params), orderBy creation date, url, type filter by url and type  (implement api endpoint - only root)


---

following executed byt not needed:
issue: a root users are not seeing menues: 

  * root can see an extra menu and screens:
    * menu root -> users: display a list of users (html data-table), with pagination (limit and offset params), orderBy creation date, email, role root and filter by email (implement api endpoint - only root)
    * menu root -> documents  display a list (html data-table) which contains all documents , with pagination (limit and offset params), orderBy creation date, url, type filter by url and type  (implement api endpoint - only root)
    * menu root -> lists:   display a list (html data-table) which contains all documents , with pagination (limit and offset params), orderBy creation date, url, type filter by url and type  (implement api endpoint - only root)


# prompt: user details

a root user , user list, can click a user and show user details and modify them
re-use the account screen if possible
backend: only the root user can change other users. An admin uuser can only edit himself

* a root user, in the lists listing, can click a list and see its details, reuse current list page
* a root user, in the documents list, can click a document and see its details. Reuse current document details page


# prompt: doc tools

there are documentTools which given a url or other document description, takes care of facilitating its content and processing somehow.
For example, a webpage document can be extracted its text or a text audio generation, a youtube document can extract the video file or audio file, etc
Model db tools table, columns:
 * id (pk)
 * name
 * description
 
create toolsDocumentType relation table, which defines to which document type a tool can be applied. columns: tool_id (fk) documentType: str
create these tools records
 * youtube-audio
 * youtube-video
 * webpage-text

 the root user have a "tools" menu where he can list all tools and clicking a tool opens the tool screen shoing its details and which documents it applies. root cannot add, edit  or remove tool, that can only be done by a developer since they requires an implkementation code

on current change document status endpoint, the client myust pass the toolId. In the UI, instead of displaying document status and "prepare" action buttons, display this information for the list of tools that apply to the document type


# prompt: doc tools actions

tools define actions which can be trigger on certain document (type). The default action is "load" and all tools have it, but particular tools can trigger other actions such as "download", "
also tools accept params (json object arbitrary signature) when called
in db model this in two tables: actions (name, description, paramsSchema) and toolActions relational table 1 tool -> n actions
there is a default tool action called "load" and all existing tools support "load"
in endpoint PUT /api/documents/3/status besides the tool also pass the "action" and the "params"
in PUT /api/documents/3/status there'a a ToolsService that handle the call and redirect to a tool implementation accepting action and params
implement each tool in a separate implementation file, for now they only sleep 5 seconds


# prompt: doc status history list

in the document page, there's a document which takes me to document status changelog which list all documentStatusHistory records with pagination and status filtering, displaying dates and status change in a table. default order is createdAt DESC

in documentStatusHistory also save action and params. In the ui document status history screen display two columns action (action name)
when user click an status change row sees the document status change screen displaying details about the change such is document, date, status, action ,params, etc


# prompt youtube tool

lets immplement youtube-audio and youtube-video tool which downloads youtube audio as mp3 and returns an accesible url to it so user cah listen to it in the frontend.

First, we want a facade on FileSystem, which allows us to save the buffer and then obtain an url for it. Interface:
 load(document, tool) -> Resource {url, mimetype}

lets implement a local file storage that will just save downloaded resources into localhost. in the future we could have a aws s3 bucket or something else

the local file storage implementation, ends up using backend/src/integrations/youtube/index.ts to download the file. You need to model a local storage or file tracking so we can know where the file url is generated locally and serve it as a public url so the frontend can access the audio file.