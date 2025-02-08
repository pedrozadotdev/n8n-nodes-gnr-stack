export const loginPageHTMLTemplate = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Login</title>
    <style>
      body {
        font-family: sans-serif;
        margin: 0;
        padding: 0;
        background-color: #ff6f5c;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }

      .container {
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        padding: 30px;
        width: 90%;
        max-width: 400px;
        text-align: center;
      }

      .logo {
        width: 60px;
        height: 60px;
        margin: 0 auto 30px;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .logo svg {
        width: 100%;
        height: 100%;
        fill: #ff6f5c;
      }

      .input-group {
        margin-bottom: 20px;
        text-align: left;
      }

      .input-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
        color: #333;
      }

      .input-group input {
        width: 100%;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-sizing: border-box;
      }

      button {
        background-color: #20b69e;
        color: white;
        padding: 12px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1em;
        width: 100%;
      }

      button:hover {
        opacity: 0.8;
      }

      .error-message {
        color: red;
        margin-top: 10px;
      }

      @media (max-width: 600px) {
        .container {
          padding: 20px;
          margin: 15px;
        }

        .logo {
          width: 50px;
          height: 50px;
          margin-bottom: 20px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" xml:space="preserve">
					<path d="M76.8 409.512c28.237 0 51.2-22.963 51.2-51.2 0-28.237-22.963-51.2-51.2-51.2-28.237 0-51.2 22.963-51.2 51.2 0 28.237 22.963 51.2 51.2 51.2zM76.8 426.667c-41.361 0-76.8 28.151-76.8 51.2v25.6A8.53 8.53 0 0 0 8.533 512h136.533a8.53 8.53 0 0 0 8.533-8.533v-25.6c.001-23.049-35.438-51.2-76.799-51.2zM204.8 358.312c0 28.237 22.963 51.2 51.2 51.2s51.2-22.963 51.2-51.2c0-28.237-22.963-51.2-51.2-51.2s-51.2 22.963-51.2 51.2zM256 426.667c-41.361 0-76.8 28.151-76.8 51.2v25.6a8.53 8.53 0 0 0 8.533 8.533h136.533a8.53 8.53 0 0 0 8.533-8.533v-25.6c.001-23.049-35.438-51.2-76.799-51.2zM384 358.312c0 28.237 22.963 51.2 51.2 51.2 28.237 0 51.2-22.963 51.2-51.2 0-28.237-22.963-51.2-51.2-51.2-28.237 0-51.2 22.963-51.2 51.2zM435.2 426.667c-41.361 0-76.8 28.151-76.8 51.2v25.6a8.53 8.53 0 0 0 8.533 8.533h136.533a8.53 8.53 0 0 0 8.533-8.533v-25.6c.001-23.049-35.438-51.2-76.799-51.2zM76.8 273.067a8.53 8.53 0 0 0 8.533-8.533v-25.6c0-28.237 22.963-51.2 51.2-51.2h110.933v76.8c0 4.71 3.814 8.533 8.533 8.533s8.533-3.823 8.533-8.533v-76.8h110.933c28.237 0 51.2 22.963 51.2 51.2v25.6c0 4.71 3.814 8.533 8.533 8.533s8.533-3.823 8.533-8.533v-25.6c0-37.641-30.626-68.267-68.267-68.267H264.533v-34.133h128c14.114 0 25.6-11.486 25.6-25.6V25.6c0-14.114-11.486-25.6-25.6-25.6H119.467c-14.114 0-25.6 11.486-25.6 25.6v85.333c0 14.114 11.486 25.6 25.6 25.6h128v34.133H136.533c-37.641 0-68.267 30.626-68.267 68.267v25.6a8.532 8.532 0 0 0 8.534 8.534zm256-230.4a8.53 8.53 0 0 1 8.533-8.533H358.4c14.114 0 25.6 11.486 25.6 25.6s-11.486 25.6-25.6 25.6h-8.533v8.533a8.53 8.53 0 0 1-8.533 8.533 8.53 8.53 0 0 1-8.533-8.533v-51.2zm-59.733-8.534H307.2a8.53 8.53 0 0 1 8.533 8.533 8.53 8.53 0 0 1-8.533 8.533h-8.533v42.667c0 4.71-3.814 8.533-8.533 8.533s-8.533-3.823-8.533-8.533V51.2h-8.533a8.53 8.53 0 0 1-8.533-8.533 8.529 8.529 0 0 1 8.532-8.534zM179.2 93.867c0 4.71-3.814 8.533-8.533 8.533s-8.533-3.823-8.533-8.533V76.8h-17.067v17.067c0 4.71-3.814 8.533-8.533 8.533S128 98.577 128 93.867v-51.2c0-4.71 3.814-8.533 8.533-8.533s8.533 3.823 8.533 8.533v17.067h17.067V42.667c0-4.71 3.814-8.533 8.533-8.533s8.533 3.823 8.533 8.533v51.2zM238.933 51.2H230.4v42.667c0 4.71-3.814 8.533-8.533 8.533s-8.533-3.823-8.533-8.533V51.2H204.8a8.53 8.53 0 0 1-8.533-8.533 8.53 8.53 0 0 1 8.533-8.533h34.133a8.53 8.53 0 0 1 8.533 8.533 8.53 8.53 0 0 1-8.533 8.533z"/>
					<path d="M366.933 59.733c0-4.702-3.823-8.533-8.533-8.533h-8.533v17.067h8.533c4.71 0 8.533-3.832 8.533-8.534z"/>
				</svg>
      </div>

      <form id="login-form" method="post" action="#ACTION#">
        <div class="input-group">
          <label for="user">User:</label>
          <input
            id="user"
            type="text"
            name="user"
            placeholder="Enter user"
            required
          />
        </div>

        <div class="input-group">
          <label for="password">Password:</label>
          <input
            id="password"
            type="password"
            name="password"
            placeholder="Enter password"
            required
          />
        </div>

        <button type="submit">Sign In</button>

        <div class="error-message" id="error-message">#ERROR_MESSAGE#</div>
      </form>
    </div>
  </body>
</html>`;

export const redisRLScript = `
-- Returns 1 if allowed, 0 if not
local key                   = KEYS[1]
local now                   = tonumber(ARGV[1])

local timeoutSeconds = {1, 2, 4, 8, 16, 30, 60, 180, 300}

local fields = redis.call("HGETALL", key)
if #fields == 0 then
    redis.call("HSET", key, "index", 1, "updated_at", now)
    return {1}
end
local index = 0
local updatedAt = 0
for i = 1, #fields, 2 do
	if fields[i] == "index" then
        index = tonumber(fields[i+1])
    elseif fields[i] == "updated_at" then
        updatedAt = tonumber(fields[i+1])
    end
end
local allowed = now - updatedAt >= timeoutSeconds[index]
if not allowed then
    return {0}
end
index = math.min(index + 1, #timeoutSeconds)
redis.call("HSET", key, "index", index, "updated_at", now)
return {1}
`;
