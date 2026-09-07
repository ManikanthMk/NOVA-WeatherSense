const express=require('express'); const cors=require('cors'); const app=express(); const PORT=process.env.PORT||10000;
app.use(cors()); app.use(express.json());
let weatherData={deviceId:'nova-weather-01',temperature:null,humidity:null,rain:'UNKNOWN',wifi:'OFFLINE',lastUpdate:null};
app.get('/',(req,res)=>res.json({project:'NOVA WeatherSense',status:'ONLINE',message:'WeatherSense backend is running'}));
app.get('/api/health',(req,res)=>res.json({status:'ONLINE',time:new Date().toISOString()}));
app.post('/api/sensor',(req,res)=>{const {deviceId,temperature,humidity,rain}=req.body;if(typeof temperature!=='number'||typeof humidity!=='number')return res.status(400).json({success:false,message:'temperature and humidity must be numbers'});weatherData={deviceId:deviceId||'nova-weather-01',temperature,humidity,rain:rain||'UNKNOWN',wifi:'ONLINE',lastUpdate:new Date().toISOString()};console.log('Sensor Data Received:',weatherData);res.json({success:true,message:'Sensor data received',data:weatherData});});
app.get('/api/sensor',(req,res)=>res.json(weatherData));
app.listen(PORT,'0.0.0.0',()=>console.log(`NOVA WeatherSense running on port ${PORT}`));
