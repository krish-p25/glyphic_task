#Overview

Frontend: React.js
Backend: Node.js,
API: Express.js
Database: PostgreSQL

These technologies were chosen as they are cleanly deployable, readily scalable and align well with the current stack used at Glyphic

##React.js Frontend

The frontend is relatively simple and written in App.jsx. As there is only one page, no components have been seperated off into different files.

##Node.js Backend

The backend is organised into controllers, routes, database models. A simple Express.js API is 
used to communicate with the frontend. As the project runs on localhost, there is no SSL or HTTPS 
set up needed for the app initialisation.

Database models use Sequelize ORM to communicate with the Node.js backend. This provides cleaner 
integration with the controller and subsequent Express routes. Should this app be pushed to 
production level, sequelizes's belongsTo feature can also make bulk querying faster, translating 
to faster loading times to user prompts.

##Database
The current database uses only 3 tables: APIRequest, Chat and Message. To help further scale this 
project, Redis can also be integrated. This would drastically decrease loading and querying times, 
as currently, the API request endpoint is stored to prevent having to find it again if a user 
wants more information, the data from the endpoint itself is not stored as this may change. 
However, with the use of Redis, the data from the endpoint can be stored with a medium-to-long 
TTL, alleviating stress from the Glyphic API and also increasing response speeds.