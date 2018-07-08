class ReGenerator {
  constructor(samples, start_idx = 0) {
    
    let sample_keys = Object.keys(samples);
  
    if(samples[sample_keys[start_idx]].parsed) {
      return samples[sample_keys[start_idx]].parsed
    }
  
    if(!samples[sample_keys[start_idx]].fill) {
      throw new Error('sample must have a substitute: ' + sample_keys[start_idx] + " = " + JSON.stringify(samples[sample_keys[start_idx]]));
    }
    
    else if(samples[sample_keys[start_idx]].fill.endsWith('.')) {
      this.getContext = (new Function("return (_) => _." + samples[sample_keys[start_idx]].fill.substr(0, samples[sample_keys[start_idx]].fill.length - 1)))();
    } else if(samples[sample_keys[start_idx]].fill.endsWith('[]')) {
      this.getContext = (new Function("return (_) => _." + samples[sample_keys[start_idx]].fill.substr(0, samples[sample_keys[start_idx]].fill.length - 2)))();
      this.for_array = true;
      this.between = samples[sample_keys[start_idx]].between;
    } else {
      let cb = samples[sample_keys[start_idx]].parsed = (new Function("return (_) => '' + _." + samples[sample_keys[start_idx]].fill))();
      if(samples[sample_keys[start_idx]].fn) {
        cb.fn = samples[sample_keys[start_idx]].fn;
      }
      return cb;
    }

    samples[sample_keys[start_idx]].parsed = this;
    
    // ni`пройтись по всем семплам и подставить все значения`;
    
    var string = sample_keys[start_idx];
    
    if(this.for_array) {
      // console.log('fount stplit');
      string = string.split(samples[sample_keys[start_idx]].between)[0];
      // console.log('fount stplit', string);
    }
  
    for(var i = start_idx + 1; i < sample_keys.length; i++) {
      let sample = samples[sample_keys[i]];
      if(!sample.parsed) {
        new ReGenerator(samples, i)
      }
      let idx;
      while((idx = string.indexOf(sample_keys[i])) > -1 ) {
        string = string.substr(0, idx) + "\x00\x01\x02" + i + "\x02\x01\x00" + string.substr(idx + sample_keys[i].length)
      }
    }
  
  
    let values = [];
    
    string.replace(/\x00\x01\x02[0-9]+\x02\x01\x00/g, function(a, num) {
      num = Number(a.match(/[0-9]+/)[0]);
      values.push(samples[sample_keys[num]].parsed);
    });
  
    this.sequence = string.split(/\x00\x01\x02[0-9]+\x02\x01\x00/);
    for(let i = values.length; i--;) {
      this.sequence.splice(i + 1, 0, values[i]);
    }
  
    // console.log(this.sequence);
  
    // ni`распарсить полученную строку на готовые сэмплы`;
    
    
  }
  
  generate(values) {
    let string = "";
    // console.log('xuxu', values, this.getContext.toString(), this.getContext(values));
    let context = this.getContext(values);
  
    let gen = (context) => {
      for(let val of this.sequence) {
        if(val instanceof ReGenerator) {
          // console.log('1 string+=', val.generate(context));
          string += val.generate(context);
        } else if(val instanceof Function) {
          // console.log('2 string+=', val(context), val, context);
          string += val.fn ? val.fn(val(context)) : val(context);
        } else {
          // console.log('3 string+=', val);
          string += "" + val;
        }
      }
    };
  
    if(this.for_array) {
      // console.log('for_array');
      for(var i = 0; console.log(i, context[i]) , context[i]; i++) {
        gen(context[i]);
        if(context[i+1]) {
          string += this.between
        }
      }
    } else {
      gen(context)
    }
    
    return string;
  }
  
  
}

module.exports = ReGenerator;

let aop = require('../yucalc3/aop.js');

aop.test(function() {
  let generator = new ReGenerator({
    "table.Lookup(({col1}, n) => col1(n), ((_) => ({col2}, n) => col2(n) == _ )(val2) , ((_) => ({col3}) => col3(n) >= _ )(val3) )": { _: "lookup." },
    "table"  : { _: "result.table" },
    "Lookup" : { _: "name" },
    "col1"   : { _: "result.column" },
    "((_) => ({col2}, n) => col2(n) == _ )(val2) , ((_) => ({col3}) => col3(n) >= _ )(val3)"
      : { _: "filter[]", between: " , ", keep_spaces: true },
    "col2"   : { _: "column" },
    "=="     : { _: "operator" },
    "val2"   : { _: "value" },
  });
  
  console.log('zzz', generator.generate({lookup: {name: 'SumIf', result: {table: "tab_zizi", column: "Col1"}, filter: [{column: 'colX', operator: "===", value: "zuzu"},{column: 'colP', operator: ">=", value: "puzu"},]}}));
  
});



/*


проектирование по CORE:

объекты:
GeneratorSampleParser

события:
GeneratorSampleParser
GeneratorSampleParser_FoundNewExpression
GeneratorSampleParser_




действия:
GeneratorSampleParser.goThroughAllSamplesAndSubstitute on GeneratorSampleParser_FoundNewExpression





 */


function ni(descr) {
  throw new Error("Not fully implemented: " + descr);
}

function pni(descr) {
  if(!pni[descr]) {
    pni[descr] = true;
    console.warn(new Error("Warning - not fully implemented: " + descr).stack);
  }
}

function sb(descr, ...args) {
  throw new Error("Strange behaviour: " + descr + (args && args.length ? JSON.stringify(args) : ""));
}
