## Setup Instructions

1. Create the PostgreSQL database:
   CREATE DATABASE glyphic;
   Ensure a user with username 'postgres' and password 'postgres' has access to this database.
   Else change the database authentication credentials in .env

2. Install dependencies:

   In main folder:
   npm install

   Frontend:
   cd frontend
   npm install

3. Start backend:
   node server.js

4. Start frontend:
   npm run dev

## AI Assistance
The main AI tool used in assistance with this project is Open AI's Codex via terminal.

Codex has been used to create a polished, user-friendly React interface for the user frontend. 
This includes providing a basic description and framework of the Chat page, and asking it to 
polish the UI to make it look modern, by adding the relevant tailwind classes.
Codex was further used to add mobile compatibility to the frontend.
Frontend animations such as auto scroll to focused chat, smooth rendering of chat messages by 
opacity transition were also added via prompt for those features specfically. 
Features such as the API Connection status in the top right of the screen, were prompted to be 
added, and then integrated by Codex on the frontend, with the /health endpoint and 
response handling programmed manually. On mobile view, the Chat/Chat History toggle were also
manually prompted to be added, and then integrated by Codex. From this point some of the mobile 
tailwind classes were clashing so these fixes were integrated manually, this includes the <main> 
element being a grid on wide screens and vertical flexbox on mobile.

Codex was not used for any backend development. 
Minor bugs, such as imports, module exports, typo handling and code consistency was handled by 
GitHub Copilot.

Cursor was used as the IDE for this project however no prompting was used.