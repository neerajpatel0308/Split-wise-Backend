import Settlement from "../models/Settlement";

import Group from "../models/Group.js";
import { CommandSucceededEvent } from "mongodb";

export const createSettlement = async (req,res)=>{
    try {
        const {groupId , receiver , amount ,note} = req.body;

        //logged in user

        const payer = req.user._id;

        //validation
        if(!groupId || !receiver||!amount){
            return res.status(400).json({
                success:false,
                messsage:"Group,receiver and amount are required",
            });
        }
    }
}