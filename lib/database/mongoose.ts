import mongoose,{Mongoose} from "mongoose";

const MONGODB_URL = process.env.MONGODB_URI

// In next js we have to call the connection in every server action /api request
// since it runs serverless environment
interface MongooseConnection {
    conn: Mongoose | null
    promise: Promise<Mongoose> | null

}
// To optimize the process we will implement caching
let cached : MongooseConnection = (global as any).mongoose

if(!cached){
    cached = (global as any).mongoose ={
        conn: null,promise: null
    }
}

export const  connectToDatabase  = async () => {
    if(cached.conn) return cached.conn;

    if(!MONGODB_URL) throw new  Error("Missing MongoDB URL");

    cached.promise= cached.promise || mongoose.connect(MONGODB_URL ,{
        dbName:"Pixel_Palette", bufferCommands: false
    })

    cached.conn  = await cached.promise;
}