global.ni = function(descr) {
  throw new Error("Not fully implemented: " + descr);
};

global.fi = function() {};

global.pni = function(descr) {
  if(!pni[descr]) {
    pni[descr] = true;
    console.warn(new Error("Warning - not fully implemented: " + descr).stack);
  }
};

global.sb = function(descr, ...args) {
  throw new Error("Strange behaviour: " + descr + (args && args.length ? JSON.stringify(args) : ""));
};



var filename = new Error().stack.split("\n").filter(_=>_.indexOf('internal') === -1)[2].match(/\/[^:]+/)[0];

let fs = require('fs');
let code = fs.readFileSync(filename).toString();
let sum_h = 0;

code.replace(/([0-9.]+)h/g, function(_, h) {
  if(Number(h)) {
    sum_h += Number(h);
  }
});


let t1 = new Date(Date.now() + sum_h * 3600 * 1000).toTimeString().substr(0, 5);


code = code.replace(/estimate.finish=([0-9][0-9]:[0-9][0-9])?/, 'estimate.finish=' + t1);

fs.writeFileSync(filename, code);

