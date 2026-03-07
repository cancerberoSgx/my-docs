# prompt 1

## prompt 

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

Add the following information to DB tables, endpoints API and also reflect this information on the frontend

 * db users table new columns: 
   * createdAt: timestamp
   * updatedAt: timestamp
 * db documents table new columns
