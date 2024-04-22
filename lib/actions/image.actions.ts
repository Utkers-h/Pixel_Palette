"use server"

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "../database/mongoose"
import { handleError } from "../utils"
import User from "../database/models/user.model";
import Image from "../database/models/image.model"
import { redirect } from "next/navigation"

import { v2 as cloudinary } from 'cloudinary'

const populateUser = (query: any) => query.populate({
    path: 'author',
    model: User,
    select: '_id firstName lastName clerkId'
  })

// ADD Image to the database
export async function addImage({image,userId,path}: AddImageParams){
    try {
        await connectToDatabase();

        const author = await User.findById(userId); // Find user by id in users collection

        if(!author){
            throw new Error("User not found in the database!!")
        }

        const newImage = await Image.create({
            ...image,
            author: author._id,
        })

        revalidatePath(path); // Invalidate cache of this path

        return JSON.parse(JSON.stringify(newImage)); 


    } catch (error) {

        handleError(error)
        
    }
}

// Update the  image in the database
export async function updateImage({image,userId,path}: UpdateImageParams){
    try {
        await connectToDatabase();

        const imageToUpdate = await Image.findById(image._id)

        if(!imageToUpdate || imageToUpdate.author.toHexString()!== userId){
            throw new Error("Unauthorized or Image not Found!!")
        }

        const  updatedImage =await Image.findByIdAndUpdate(
            imageToUpdate._id,
            image,
            {
                new: true
            }
            
        )

        revalidatePath(path); // Invalidade cache of this path

        return JSON.parse(JSON.stringify(updatedImage)); 


    } catch (error) {

        handleError(error)
        
    }
}
// delete the image in database
export async function deleteImage(imageId: string){
    // only need image id to delete the image
    try {
        await connectToDatabase();

        await Image.findByIdAndDelete(imageId);


    } catch (error) {

        handleError(error)
        
    }
    finally{
        redirect('/')
    }
}

// Get image by Id
export async function getImageById(imageId: string){
    try {
        await connectToDatabase();

        const image = await populateUser(await Image.findById(imageId))

        if(!image) throw new Error("No image with that ID")

        return JSON.parse(JSON.stringify(image)); 


    } catch (error) {

        handleError(error)
        
    }
}

// Get all Images
export async function getAllImages({ limit = 9, page = 1, searchQuery = '' }: {
    limit?: number;
    page: number;
    searchQuery?: string;
  }) {
    try {
      await connectToDatabase();
  
      cloudinary.config({
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      })
  
      let expression = 'folder=pixel_palette';
  
      if (searchQuery) {
        expression += ` AND ${searchQuery}`
      }
  
      const { resources } = await cloudinary.search
        .expression(expression)
        .execute();
  
      const resourceIds = resources.map((resource: any) => resource.public_id);
  
      let query = {};
  
      if(searchQuery) {
        query = {
          publicId: {
            $in: resourceIds
          }
        }
      }
  
      const skipAmount = (Number(page) -1) * limit;
  
      const images = await populateUser(Image.find(query))
        .sort({ updatedAt: -1 })
        .skip(skipAmount)
        .limit(limit);
      
      const totalImages = await Image.find(query).countDocuments();
      const savedImages = await Image.find().countDocuments();
  
      return {
        data: JSON.parse(JSON.stringify(images)),
        totalPage: Math.ceil(totalImages / limit),
        savedImages,
      }
    } catch (error) {
      handleError(error)
    }
  }

  // GET IMAGES BY USER
export async function getUserImages({
  limit = 9,
  page = 1,
  userId,
}: {
  limit?: number;
  page: number;
  userId: string;
}) {
  try {
    await connectToDatabase();

    const skipAmount = (Number(page) - 1) * limit;

    const images = await populateUser(Image.find({ author: userId }))
      .sort({ updatedAt: -1 })
      .skip(skipAmount)
      .limit(limit);

    const totalImages = await Image.find({ author: userId }).countDocuments();

    return {
      data: JSON.parse(JSON.stringify(images)),
      totalPages: Math.ceil(totalImages / limit),
    };
  } catch (error) {
    handleError(error);
  }
}