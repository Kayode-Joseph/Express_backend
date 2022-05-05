//in progress

const mailler=async ()=>

{
        const nodemailer = require('nodemailer');

        const transporter = nodemailer.createTransport({
        service: 'hotmail',

        auth: {
            user: 'kayode.joseph.1252@outlook.com',

            pass: 'MOSADmko123',
        },
        });

        const options = {
        from: 'kayode.joseph.1252@outlook.com',

        to: 'kayode.joseph.1252@gmail.com',

        subject: 'Admissions Enquiry',

        text: 'Hello my daughter, I missed you so much. I heard u were sick'
        };
        try{
       const tt= await transporter.sendMail(options)

       console.log(tt.info)
        }
        catch(e){

            console.log(e)
        }
    
    }

