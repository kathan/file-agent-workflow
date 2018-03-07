/*
file-agent-workflow
*/


const FileAgent = require('file-agent');
const path = require('path');

var FileAgentWorkflow = function(options, callback){
  if ( !(this instanceof FileAgentWorkflow) ){
    return new FileAgentWorkflow(options, callback);
  }
  var self = this;
  var running = false;
  var agents = [];
  var log = function(){
    var d = new Date();
    const args = Array.from(arguments);
    args.unshift(d);
    console.log.apply(this, args);
  } || options.log;
  var error = function (){
    const args = Array.from(arguments);
    args.unshift('ERROR:');
    var e = new Error();
    args.push(e.stack);
    log.apply(null, args);
  } || options.error;
  
  var app = options.app;//required
  var wf_name = options.wf_name;//required
  var wf_dir = options.wf_dir; //required
  
  options.running ? running = options.running : null;
  options.agents ? agents = options.agents :null;
  
  this.stop = function(){
    agents.forEach((agent)=>{
      agent.stop();
    });
  };
  
  this.start = function(){
    agents.forEach((agent)=>{
      agent.start();
    });
  };
  
  this.newAgent = function(agent_opts, cb){
    
    var fa = FileAgent({app: app,
                        path: path.resolve(__dirname, wf_dir, agent_opts.dir),
                        name: agent_opts.agent_name,
                        dest: agent_opts.dest,
                        log: log,
                        error: error}, (err)=>{
      if(err){return cb(err);}
      
      log(`Running agent ${agent_opts.agent_name}`);
      fa.start();
      cb();
    });
    
    fa.on('file', agent_opts.script);
    
    fa.on('error', (err)=>{
      error('Error', err);
    });
    
    agents.push(fa);
  };
  
  app.put(`/${wf_name}/start`, (req, res, next)=>{
    self.start();
    res.json({message:`Started ${wf_name}`});
    next();
  });
    
  app.put(`/${wf_name}/stop`, (req, res, next)=>{
    self.stop();
    res.json({message:`Stopped ${wf_name}`});
    next();
  });
  
  callback();
};

module.exports = FileAgentWorkflow;