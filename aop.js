let context = {
  values: Symbol()
};

let allowed_classes = null;
let add_classes = null;

let aop = module.exports;

function declare_context(object, root_global_context) {
  let objects;
  // console.log('0', classes);
  if(!root_global_context) {
    objects = object[context.values] = [object];
    for(let k in classes) {
      let c = classes[k];
      if(!allowed_classes || allowed_classes.indexOf(c) > -1) {
        // console.log(1, c);
        // console.log(2, !!c.createInContext);
        if(c.createInContext) {
          let o = c.createInContext(object);
          if(o) {
            object[context.values].push(o);
          }
        }
      }
    }
    if(add_classes) {
      for (let k in add_classes) {
        let c = add_classes[k];
        let o = new c();
        if (o) {
          object[context.values].push(o);
        }
      }
    }
  } else {
    objects = object[context.values] = Object.values(classes);
  }
  
  for(let o of objects) {
    for(let me of Object.getOwnPropertyNames(root_global_context ? o : Object.getPrototypeOf(o))) {
      if(o[me] instanceof Function && o[me] !== o.constructor) {
        let code = (o[me] && o[me].method || o[me]).toString(), match;
        // console.log(me, '=', code);
        if(match = code.match(/\/\/ AOP (before|after)_call ([^.]+)\.(.+)/)) {
          for(let obj of objects) {
            // console.log('match[2]=' + match[2], classname2class[match[2]]);
            // console.log(match[1], match[2], match[3]);
            console.log(obj, classname2class[match[2]], obj === classname2class[match[2]], match[0]);
            if(obj instanceof classname2class[match[2]] || (root_global_context && obj === classname2class[match[2]])) {
              // console.log('found instanceof ' + match[2]);
              for(let m of Object.getOwnPropertyNames(root_global_context ? obj : Object.getPrototypeOf(obj))) {
                
                console.log('obj[m]', m, match[3], obj);
                
                if((match[3] === '*' || match[3] === m) && obj[m] instanceof Function) {
                  console.log('obj[m].aopWrapped=', obj[m].aopWrapped);
                  if(!obj[m].aopWrapped) {
                    let wrapper = wrap_method(o, obj[m]);
                    // console.log('wrapper=', wrapper);
                    obj[m] = wrapper;
                    // console.log('obj[m]=', obj[m]);
                  }
                  console.log(obj[m]);
                  // console.log('qm', match[1], o[me]);
                  obj[m][match[1]].push([o, o[me]])
                }
              }
            }
          }
        }
        // console.log('match', match);
      }
    }
  }
  
  function wrap_method(object, method) {
    function aspect_wrapper() {
      for(let i = 0, fns = aspect_wrapper.before, len = fns.length; i < len; i++) {
        let fn = fns[i];
        let result = fn[1].call(fn[0], this, method, arguments);
        if(result !== undefined) {
          return result
        }
      }
      let result = method.apply(this, arguments);
      for(let i = 0, fns = aspect_wrapper.after, len = fns.length; i < len; i++) {
        let fn = fns[i];
        let replace_result = fn[1].call(fn[0], this, method, arguments, result);
        if(replace_result !== undefined) {
          return replace_result
        }
      }
      return result;
    }
    aspect_wrapper.method = method;
    aspect_wrapper.aopWrapped = true;
    aspect_wrapper.before = [];
    aspect_wrapper.after = [];
    return aspect_wrapper;
  }
}

// let classes = [];
let classname2class = {};
global.classes = classname2class;

module.exports.declare_context = declare_context;
module.exports.symbol_context_values = context.values;
module.exports.registerClass = (class_object) => {
  // console.log('registerClass', class_object.name, class_object);
  if(Object.values(classes).indexOf(class_object) === -1) {
    // classes.push(class_object);
    classname2class[class_object.name] = class_object
  }
};


let globalContext = {};
setImmediate(function() {
  console.log('parsing static hooks');
  declare_context(globalContext, true);
});


module.exports.test
  = process.argv.indexOf('--test') === -1
  ? function() {return module.exports.test}
  : function f(name) {
    
    const stack = (new Error()).stack;
    const stackLine = stack.split("\n")[2];
    const callerModuleName = /\((.*):\d+:\d+\)$/.exec(stackLine)[1];
    
    if(require.main.filename !== callerModuleName && f.caller !== module.exports.test && f.caller !== module.exports.test.repeat) {
      return module.exports.test
    }
    
    if(_lastTestObj) {
      globalTestQueue.push(_lastTestObj);
    }
    _testChain = [];
    _lastTestObj = Object.create(module.exports.test);
    _lastTestObj._name   = typeof name == 'string' ? name: '[no name]';
    _lastTestObj.context = {};
    if(name instanceof Function) {
      _lastTestObj.run(name)
    }
    return _lastTestObj;
  }
;

let _testChain = [], _testChainReset = 0, _lastTestObj, globalTestQueue = [], last_test_cb = null;

module.exports.test.run
  = module.exports.test.step
  = module.exports.test.name
  = module.exports.test.test
  = process.argv.indexOf('--test') === -1
  ? function() {return module.exports.test}
  : function f(cb) {
    
    const stack = (new Error()).stack;
    const stackLine = stack.split("\n")[2];
    const callerModuleName = /\((.*):\d+:\d+\)$/.exec(stackLine)[1];
    
    if(require.main.filename !== callerModuleName && f.caller !== module.exports.test && f.caller !== module.exports.test.repeat) {
      return this
    }
    
    // (_testChainReset++) || Promise.resolve().then(()=>{
    (_testChainReset++) || process.nextTick(() => {
      _testChainReset = 0;
      _lastTestObj = null;
      this.chain = _testChain;
      _testChain = [];
      globalTestQueue.push(this);
      console.log('run chain');
      module.exports.test._runChain()
    });
    
    _testChain.push(cb);
    last_test_cb = cb;
    
    // cb({
    //   context: {},
    //   log: {
    //     is: function(pattern) {
    //
    //     }
    //   }
    // });
    return this;
  }
;

let _test_chain_idx = 0, console_log = console.log, logs = "";
let colors;

module.exports.test._runChain = function() {
  if(!colors) {
    colors = require('colors')
  }
  if(_test_chain_idx === 0 && globalTestQueue[0]) {
    console.log();
    console.log(('Test: ' + globalTestQueue[0]._name + "...").red);
    aop.probe = new Proxy({}, {set: function(target, key, value) { logs +=  `aop.probe.${key} = ` + JSON.stringify(value); }});
  }
  // console.log = function(...args) {
  //   logs += "\n" + args.map(it=>typeof it === 'symbol' ? 'symbol[]' : it ).join(" ");
  //   console_log.apply(console, arguments)
  // };
  if(globalTestQueue.length) {
    let obj = globalTestQueue[0];
    let cb = obj.chain[_test_chain_idx];
    let keep_output = false;
    let async = false;
    let args = new Proxy({}, {
      get: function(target, key, receiver) {
        console.log('receive', key);
        if(key === 'done') {
          async = true;
          return _continue;
        }
        if(key === 'context') {
          return obj.context;
        }
        if(key === 'log') {
          keep_output = true;
          return {
            is: function(log) {
              let diff = require('diff');
              log = log.replace(/^\n+/, ''); // fix bug of diff module
              log = log.replace(/\s+$/, ''); // fix bug of diff module
              logs = logs.replace(/^\n+/, '');
              logs = logs.replace(/\s+$/, '');
              let diffs = diff.diffLines(log, logs, {ignoreWhitespace: true});
              if(diffs.filter(it=>it.removed || it.added).length > 0) {
                console_log('log=', log);
                console_log('logs=', logs);
                console_log(diffs);
                console_log("");
                console_log("  Compare with the current log:");
                console_log("");
                console_log(diffs.map(it => !it.removed && (it.added ? it.value.green : it.value) || "").join(""));
              }
            }
          };
        }
      }
    });
    cb(args);
    
    if(!async) {
      _continue();
    }
    
    function _continue() {
      _test_chain_idx++;
      if(!globalTestQueue[0].chain[_test_chain_idx]) {
        globalTestQueue.shift();
        _test_chain_idx = 0;
        logs = "";
      }
      if(globalTestQueue[0]) {
        module.exports.test._runChain();
      } else {
        console.log = console_log;
      }
    }
  }
};


module.exports.test.repeat =
  process.argv.indexOf('--test') === -1
    ? function() {return module.exports.test}
    : function(params, eval_fn) {
      if(!(params instanceof Array)) {
        params = [params];
      }
      for(let p of params) {
        var code = last_test_cb.toString();
        for(var i in p) {
          code = code.replace(new RegExp(i, "g"), p[i]);
        }
        if(eval_fn) {
          eval_fn("global.__REPEAT_TEST_CODE = " + code);
          code = global.__REPEAT_TEST_CODE;
        } else {
          code = new Function('return ' + code)();
        }
        module.exports.test.run(code);
      }
    };

aop.probe = new Proxy({}, {set: function() {} });
let debugger_counts = {};

// let log = console.log;
// console.log = function(...args) {
//   // return;
//   let matches = new Error().stack.split("\n")[2].match(/([^ (]+\.js):(\d+)/);
//   log.call(console, fs.readFileSync(matches[1]).toString().split("\n")[Number(matches[2]) - 1].trim().replace(/;$/, '').yellow, 'at'.yellow, matches[0].match(/[^\/]+$/)[0].yellow);
//   log.apply(console, args);
// };
//

aop.debugger = process.argv.indexOf('--test') === -1
  ? function() {}
  : function(...nums){
    let cb;
    if(nums[nums.length - 1] instanceof Function) {
      cb = nums.pop();
    }
    if(!colors) {
      colors = require('colors')
    }
    let file_line = new Error().stack.split("\n")[2].match(/[^/]+\.js:\d+/)[0];
    
    if(!debugger_counts[file_line]) {
      debugger_counts[file_line] = 0;
    }
    let num = debugger_counts[file_line]++;
    console.log('aop.debugger ' + file_line, num);
    
    if(nums.indexOf(num) > -1 || process.argv.filter(it=>it.match(/^--debugger=(\d+)/)).map(it=>Number(it.match(/^--debugger=(\d+)/)[1])).indexOf(num) > -1 ) {
      require('inspector').open(null, null, true);
      setTimeout(()=>{}, 24 * 3600 * 1000);
      if(cb) {
        cb();
        return num
      }
    } else {
      return num
    }
    debugger;
  }
;

if(process.argv.indexOf('--inspector') > -1) {
  require('inspector').open(null, null, true);
  setTimeout(()=>{}, 24 * 3600 * 1000);
}

aop.debugger.__defineGetter__('num', aop.debugger);


let preload_started = true;

let fs = require('fs');

(function preload_all(dir) {
  // console.log(dir);
  let list =
    fs.readdirSync(dir)
      .map(it=>dir + it)
      .map(it =>
        ((fs.statSync(it).isDirectory() && !it.match(/node_modules|\.git/)) && (it + "/")) ||
        (it.match(/\.js$/) && it) ||
        undefined
      )
      .filter(it=>it);
  
  list.map(function(file) {
    if(file.match(/\/$/)) {
      preload_all(file)
    } else {
      let file_contents = fs.readFileSync(file).toString();
      if(file_contents.match(/^\/\/ AOP preload/)) {
        console.log('Loading: ' + file );
        require(file);
      }
    }
  })
  
})('./');

