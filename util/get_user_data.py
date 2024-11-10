import json

async def get_user_data(user_id):    
    with open("save\save.json",'r') as file:
        data = json.load(file)
    user_data = data[str(user_id)]
    print(user_data)
    return user_data