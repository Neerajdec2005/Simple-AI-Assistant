from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from mcp import ClientSession
from mcp.client.stdio import stdio_client, StdioServerParameters
from langchain_mcp_adapters.tools import load_mcp_tools
from langgraph.prebuilt import create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
import os

load_dotenv()

model = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0,
    google_api_key=os.getenv("GOOGLE_API_KEY"),
)

server_parameters = StdioServerParameters(
    command="npx",
    env={
        "FIRECRAWL_API_KEY": os.getenv("FIRECRAWL_API_KEY")
    },
    args=["firecrawl-mcp"]
)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_agent_reply(user_message: str):
    print(f"Received user message: {user_message}")
    try:
        async with stdio_client(server_parameters) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                tools = await load_mcp_tools(session)
                agent = create_react_agent(model, tools)
                messages = [
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that can scrape websites, crawl pages, and extract data using Firecrawl tools. Think step by step and use appropriate tools to help the user."
                    },
                    {
                        "role": "user",
                        "content": user_message
                    }
                ]
                ai_response = await agent.ainvoke({"messages": messages})
                print(f"AI response: {ai_response}")
                if isinstance(ai_response, dict) and "messages" in ai_response and ai_response["messages"]:
                    return ai_response["messages"][-1].content
                else:
                    return "No response from agent."
    except Exception as e:
        print(f"Error in get_agent_reply: {e}")
        return f"Error: {e}"

@app.post("/chat")
async def chat(request: Request):
    data = await request.json()
    user_message = data.get("message", "")
    reply = await get_agent_reply(user_message)
    print(f"Returning reply: {reply}")
    return {"reply": reply}

@app.get("/")
def read_root():
    return {"status": "Backend is running"}