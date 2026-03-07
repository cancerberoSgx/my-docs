see prompts/prompt1.md for information about this project based on requirement prompts.


# Run in dev mode

preconditions: node.js, docker - docker-compose, 

one terminal: cd backend; npm run dev
other terminal: cd frontend; npm run dev
open http://localhost:3000/

# Run in your local machine and access it over internet

preconditions:  ngrok

first run in dev mode as explained above and then execute: 

```sh 
ngrok http 3000
```


# connect to local db: 

```sh 
docker exec -it $(docker ps --filter "ancestor=postgres" -q | head -n 1) psql -U postgres -d mydocs
```

or just replace the -it expression with container id


# download db data to csv

```sh 
docker exec -i $(docker ps --filter "ancestor=postgres" -q | head -n 1) \
  psql -U postgres -d mydocs \
  -c "\copy users TO STDOUT WITH CSV HEADER" \
  > tmp_users_db.csv

docker exec -i $(docker ps --filter "ancestor=postgres" -q | head -n 1) \
  psql -U postgres -d mydocs \
  -c "\copy (SELECT * from users) TO STDOUT WITH CSV HEADER" \
  > tmp_db_dump_users.csv
```