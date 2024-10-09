import mongoose from "mongoose";
import Job from "../models/jobModel.js";
import moment from 'moment';

//Create job
export const createJob = async (req, res, next) => {
    const {company, position} = req.body;

        if (!(company || position)) {
            return res.status(400).json({
                errorMessage: "Enter both fields",
            });
        }
    try{
        req.body.createdBy = req.user._id;
        // console.log(req.body.createdBy)
        const job = await Job.create(req.body);

        return res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            ErrorMessage: [],
            Result: {
                message: "Job created successfully",
                job
            }
        });
    }catch(err){
        // console.log(err, "Error occurred");
        return res.status(500).json({ errorMessage: "An error occurred while creating job" });
    }
};

//Get all jobs
export const getAllJobs = async (req, res) => {
    try {

        const {status, workType, search, sort} = req.query;

        //conditions for searching filters
        const queryObject = {
            createdBy: req.user._id
        }

        //logic filters
        if(status && status !== 'all'){
            queryObject.status = status;
        }

        if(workType && workType !== 'all'){
            queryObject.workType = workType;
        }

        if(search){
            queryObject.position = {$regex: search, $options: "i"};
        }

        let queryResult = Job.find(queryObject);

        //sorting
        if(sort === 'latest'){
            queryResult = queryResult.sort('-createdAt');
        }

         if(sort === 'oldest'){
            queryResult = queryResult.sort('createdAt');
         }

         if(sort === 'a-z'){
            queryResult = queryResult.sort('position');
         }

         if(sort === 'z-a'){
            queryResult = queryResult.sort('-position');
         }

         //pagination
         const page = Number(req.query.page) || 1;
         const limit = Number(req.query.limit) || 10;
         const skip = (page - 1 ) * limit;

         queryResult = queryResult.skip(skip).limit(limit);

         //jobs count
         const totalJobs = await Job.countDocuments(queryResult);
         const numOfPages = Math.ceil(totalJobs / limit);  

        const jobs = await queryResult;

        // const jobs = await Job.find({});
    
        if (!jobs || jobs.length === 0) {
          // console.log("No jobs found");
          return res.status(404).json({
            message: "No jobs found",
            StatusCode: 404,
            IsSuccess: false,
          });
        }
    
        res.status(200).json({
          StatusCode: 200,
          IsSuccess: true,
          totalJobs,
          numOfPages,
          pageNum: page,
          Result: {
            jobsData: jobs
          },
        });
      } catch (err) {
        // console.log(err, "Error occurred");
    
        res.status(500).json({
          message: "Internal Server Error",
          StatusCode: 500,
          IsSuccess: false,
        });
      }
};

//Update jobs

export const updateJobs = async (req, res) => {
    try {
        const id = req.params.id;
        const jobExist = await Job.findOne({ _id: id });

        if (!jobExist) {
            return jobExist.status(404).json({
              StatusCode: 404,
              isSuccess: false,
              Errormessage: "Tool not found",
            });
          }
    
        const updatedJobs = await Job.findByIdAndUpdate(id, req.body, {
          new: true,
        });

        res.status(200).json({
          message: "Job updated successfully",
          StatusCode: 200,
          isSuccess: true,
          Errormessage: [],
          Result: {updatedJobs},
        });
    
    
      } catch (err) {
        // console.log(err, "Error occured")
        return res.status(500).json({
            message: "An error occurred while updating the tool",
            StatusCode: 500,
            isSuccess: false,
            Errormessage: err.message || "Internal Server Error"
        });
      }
};

//Delete Job
export const deleteJob = async (req, res) => {
    try {
        const id = req.params.id;
        const jobExist = await Job.findOne({ _id: id });
    
        if (!jobExist) {
          return res.status(404).json({
            StatusCode: 404,
            isSuccess: false,
            Errormessage: "Job not found",
          });
        }
        await Job.findByIdAndDelete(id);
        res.status(200).json({
          StatusCode: 200,
          IsSuccess: true,
          Errormessage: [],
          message: "Job deleted successfully",
        });
      } catch (err) {
        // console.log(err, "Error occured");
        res.status(500).json({
          error: "Internal Server Error",
        });
      }
};

//Show job status
export const getJobStats = async (req, res) => {
    const stats = await Job.aggregate([
        //search by user job
        {
            $match : {
                createdBy: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $group: {
                _id : '$status', 
                count: {$sum: 1},
            }
        }

    ])

    //Default stats
    const defaultStats = {
        pending: stats.pending || 0,
        reject: stats.reject || 0,
        interview: stats.interview || 0
    }

    //Monthly yearly stats

    let monthlyApplication = await Job.aggregate([
        {
            $match: {
                createdBy : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $group: {
                _id: {
                    year: {$year: '$createdAt'},
                    month: {$month: '$createdAt'}
                },
                count: {$sum: 1}
            }
        }
    ]) 

    monthlyApplication = monthlyApplication.map((item) => {
        const {_id:{year, month}, count} = item;
        const date = moment().month(month -1).year(year).format('MMM Y')

        return {date, count}
    }).reverse()

    res.status(200).json({
        StatusCode: 200,
        IsSuccess: true,
        Errormessage: [],
        TotalJobs: stats.length,
        Result: stats,
        MonthlyApplication: monthlyApplication,
        message: "Stats created successfully",
    })
};