import jwt from 'jsonwebtoken'



//Admin auth middleware
const authAdmin = async(req,res,next)=>{

    try{
        const {atoken}=req.headers
        if(!atoken){
            return res.json({success:false,message:"Not authorized login agian"})
        }
        const token_decode= jwt.verify(atoken,process.env.JWT_SECRET)
        if(token_decode!== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD){
            return res.json({success:false,message:"Not authorized login agian"})
        }
        next()
    }
    catch(e){
        console.log(e);
        res.json({success:false,message:e.message})
    }
    
}


export default authAdmin