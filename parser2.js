// SFHF Parser

context2context = {
  "": {
    in: {
      "instruction[]": {
      }
    }
  },
  ".instruction[]": {
    "in": {
      "instruction": {
        pattern: /[A-Z]/
      }
    },
    "out": {
      "": {
      }
    },
  },
  ".instruction[].instruction": {
    "pattern": /[A-Z]/,
    "next": {
      "instruction": {
      
      },
    },
    "out": {
      "instruction[]": {
      },
    }
  },
};

/*
._start { next: expression[] }
.expression[]._start { next:  }


*/

/*
context2context = {
  "._start": {
    in: {
      "instruction[]": {
      }
    }
  },
  ".instruction[]._start": {
    "in": {
      "instruction": {
        pattern: /[A-Z]/
      }
    },
    "next": {
      "_finish": {
      }
    },
  },
  ".instruction[]._finish": {
    "out": {
    
    }
  },
  "instruction._start": {
    "pattern": /[A-Z]/,
    "next": {
      "instruction": {
      
      },
    },
    "out": {
      "instruction[]": {
      },
    }
  },
};
*/

class ReParser {
  static context2context = context2context;
  static num2context = {};

  source = "";
  parsed_path = [];
  
  static NONE  = 0;
  static IN    = 1;
  static NEXT  = 2;
  static OUT   = 3;
  
  // _get_token(pos) {
  //   for(let i = 0, spos = 0; spos < pos && i < this.parsed_path.length; i++, spos += this.parsed_path[i + ]) {
  //
  //   }
  // }
  
  constructor(source) {
    this.source = source;
    this.parsed_path.push(0, 0, 0, source.length);
  }

  try_next_token(cur) {
    let cnum = this.parsed_path[cur.sidx * 4 + 1];
    let bnum = cnum - (cnum%100000);
    console.log('cnum, bnum 1', cnum, bnum);
    let token_ok = false, try_token, try_context;
    
    let prev_node_out = false, prev_node_type;
    if(prev_node_type = this.parsed_path[(cur.sidx - 1) * 4 + 1]) {
      prev_node_out = ( prev_node_type % 100000 - prev_node_type % 10000 ) === 30000;
    }
    while(!token_ok) {
      console.log('cnum, bnum 2', cnum, bnum);
      while(!(try_token = ReParser.num2context[cnum])) {
        if(!bnum) {
          bnum = 100000;
        }
        if(!cnum) {
          cnum = bnum + (prev_node_out ? 20000 : 10000);
        }
        if(!ReParser.num2context[cnum]) {
          cnum = cnum - (cnum % 10000) + 10000;
        }
        if(cnum - bnum >= 30000 ) {
          bnum += 100000;
          cnum = 0;
        }
        if(!ReParser.num2context[bnum]) {
          console.log('return false');
          return false
        }
      }
      console.log('cnum, bnum 3', cnum, bnum);
      try_context = ReParser.num2context[bnum];
      console.log(try_context, try_token);
      
      if(try_context.context_name && cur.context.endsWith(try_context.context_name) || (try_context.context_name === "" && cur.context === "")) {
        let content, result = true;
        // try parse_between
        // try parse left space
        // try parse content
        // try parse right space
        // if everything is ok, then try to enter a choosen context
        if(try_token.pattern) {
          content = this._match_pattern(cur.pos, try_token.pattern);
          if(typeof content !== 'string') {
            result = false
          }
        }
        if(result) {
          return {
            cnum: cnum,
            between_length: 0,
            spaces_length: 0,
            content_length: content ? content.length : 0,
            full_length: content ? content.length : 0
          }
        }
      } else {
        bnum += 100000;
        cnum = 0;
      }
      if(cnum) {
        cnum++;
      }
    }
  }
  
  parse(pos = 0, context = "") {
    /*
    
    мне нужно представлени об алгоритме, о вынесенных методах, об обязанностях
    
    
     */
    // let context = this._get_token(pos);
    // if(context.contextObject !== undefined ) {
    //   return context
    // }
    
    let cur = {pos: 0, sidx: 0, fidx: 0, context: context};
    
    while(cur.pos === pos || cur.context !== context ){
      let result = this.try_next_token(cur);
      console.log('got result=', result);
      if(result) {
        if(!this.parsed_path[cur.sidx * 4 + 1]) {
          // ничего не было, вставляем ноду
          this.parsed_path[cur.sidx * 4 + 3] -= result.full_length;
          this.parsed_path.splice(
            cur.sidx * 4, 0,
            0, 0, 0, 0
          );
        } else {
          // что-то было,
          // 1. добавляем обратно длину символов к неисследованному пространству (находится по текущему индексу + 1)
          // 2. меняем параметры текущей ноды
          let bidx = cur.sidx * 4;
          let between_length     = this.parsed_path[bidx    ];
          let spaces_length      = this.parsed_path[bidx + 2];
          let right_space_length = spaces_length % 1000000;
          let left_space_length  = (spaces_length - right_space_length) / 1000000;
          let content_length     = this.parsed_path[bidx + 3];
          let old_full_length    = between_length + left_space_length + right_space_length + content_length;
          this.parsed_path[(cur.sidx + 1) * 4 + 3] += old_full_length - result.full_length;
        }
        this.parsed_path[cur.sidx * 4    ] = result.between_length;
        this.parsed_path[cur.sidx * 4 + 1] = result.cnum;
        this.parsed_path[cur.sidx * 4 + 2] = result.spaces_length;
        this.parsed_path[cur.sidx * 4 + 3] = result.content_length;
        cur.sidx++;
        cur.context = (result.cnum % 100000 - result.cnum % 100000 === 10000 ? cur.context : cur.context.replace(/\.[^.]+$/)) + "." + ReParser.num2context[result.cnum].name;
      } else {
        // не нашли подходящий токен
        // либо выход на out, либо ничего нет – надо идти назад
        // 1. пробуем out try_out_token (результат – нода с spaces, between и т.п.)
        // 2. если ничего нет – то назад (удаляем текущую ноду, итерируем дальше)
        
        // aop.debugger(0);
  
        var out_token_result = this.try_out_token(cur);
        
        console.log('out_token_result', out_token_result);
        /*
        
          <–
        
         */
        
        if(out_token_result) {
        
        } else {
        
        }
        
        if(this.parsed_path[cur.sidx * 4 + 1]) {
          result = {
            full_length:
              this.parsed_path[cur.sidx * 4 + 3] +
              0 +
              0
          };
          this.parsed_path.splice(cur.sidx * 4, 4);
        } else {
          // out path
        }
        
        this.parsed_path[cur.sidx * 4 + 3] += result.full_length;
        cur.sidx--;
        cur.context = cur.context.replace(/\.[^.]+$/, '');
      }
      
      console.log('cur.context', cur.context);
      console.log('result', result);
      console.log('this.parsed_path', this.parsed_path)
    }
    
    console.log('this.parsed_path', this.parsed_path);
    
  }
  
  try_out_token(cur) {
    /*
      1. найти, какой токен in соответствует предполагаемому out.
         то есть, идти назад, и на out-ноды делать +1, а на in-ноды делать -1,
         пока не получится 0 (начинаем, конечно с 1)
      2. ищем правило, context –> out –> нода. ноду вычисляем из context (она лежит в match(/\.([^.]+)\.([^.])+$/)[1])
     */
    let level = 1, idx = cur.sidx - 1; // deny in -> out behaviour
    while(level > 0) {
      idx--;
      if(idx < 0) {
        console.log("idx=", idx, this.parsed_path);
        throw "Can't find beginning of the parsing tree, strange behaviour"
      }
  
      let context = this.parsed_path[idx * 4 + 1];
      let dir = context%100000 - context % 10000;
      
      if(dir === 10000) {
        level--;
      }
      if(dir === 30000) {
        level++;
      }
      console.log({dir, context, level});
    }
    if(level > 0) {
      console.log(this.parsed_path);
      throw "Can't find beginning of the parsing tree, strange behaviour"
    }
    
    return {
    
    }
    
  }
  
  _match_pattern(pos, pattern) {
    if(typeof pattern === 'string') {
      throw "string pattern not supported yet"
    } else {
      pattern = new RegExp('^(' + pattern.source + ')');
      let match = this.source.substr(pos).match(pattern);
      return match && match[0];
    }
  }
}

(function() {
  let cnum = 100000;
  for(let ckey in ReParser.context2context) {
    let c = ReParser.context2context[ckey];
    c.context_name = ckey;
    ReParser.num2context[cnum] = c;
    for(let dkey in c) {
      console.log(dkey);
      let add = {in: 10000, next: 20000, out: 30000}[dkey];
      if(!add) {
        continue
      };
      let dnum = cnum + add;
      let d = c[dkey];
      for(let tkey in d) {
        let t = d[tkey];
        t.name = tkey;
        ReParser.num2context[dnum] = t;
        dnum++;
      }
    }
    cnum += 100000;
  }
})();


console.log(ReParser.num2context);

var aop = require('../yucalc3/aop');

aop.test(function() {
  
  /*
  формализуем задачу:
  - есть конструкция sdfihdsiufs ; SumIf ( Table1:col1 , :col2 > 4, col3 < 5);
  - нужно получить распарсенный массив в виде [unparsedIn], [token1], [token2], ..., [tokenN], [unparsedOut]
  - нужно трансформировать это распарсенное значение в куда-то там (replace кода, парсинг этого кода)
  
  при трансформации – любая хуйня, на которую я прыгаю, ищем ее сначала в next, а потом ищем в парентах
  на конечной ноде я длину не держу. начинаем всегда с конечной ноды (unparsed)
  
  
   */
  
  var p  = new ReParser();
  
  p.source = "function () { } ";
  
  var parsed_path = [
    0,
    ReParser.NONE,
    undefined,
    0,
    10,
    0,
    
    
    "".length, // 1. between
    ReParser.IN, // 2. direction
    context['expression'], // 3. context
    '\t\t\n'.length, // left space (2)
    ''.length, // content
    '\t\t\n'.length, // right space (3)
    
    ''.length, // between
    ReParser.NEXT,
    context['expression.function'],
    '\t\t\n'.length, // left space (2)
    ''.length, // content
    '\t\t\n'.length, // right space (3)
    
    ''.length, // between
    ReParser.OUT,
    context['expression'],
    '\t\t\n'.length, // left space (2)
    '', // content
    '\t\t\n'.length, // right space (3)
    
    
    // предполагаем, что в конце это всегда есть
    // "",
    // ReParser.NONE,
    // undefined,
    // "",
    // {length: undefined},
    // "",
  ];
  
  console.log(345);
  
});


aop.test(function() {
  
  /*
  формализуем задачу:
  - есть конструкция sdfihdsiufs ; SumIf ( Table1:col1 , :col2 > 4, col3 < 5);
  - нужно получить распарсенный массив в виде [unparsedIn], [token1], [token2], ..., [tokenN], [unparsedOut]
  - нужно трансформировать это распарсенное значение в куда-то там (replace кода, парсинг этого кода)
  
  при трансформации – любая хуйня, на которую я прыгаю, ищем ее сначала в next, а потом ищем в парентах
  на конечной ноде я длину не держу. начинаем всегда с конечной ноды (unparsed)
  
  
   */
  
  var p  = new ReParser("A;A");
  
  p.parsed_path = [
    0, // +0. between length
    0, // +1. {context_num}00000 {direction}0000 + {rule_num}
    0, // +2. {left_space_length}000000 + {right_space_length}
    10,// +3. content length
    
    
    "".length, // 1. between length
    ReParser.IN * 10000 + 1, // 2. {context_num}00000 {direction}0000 + {rule_num}
    '\t\t\n'.length, // 3. {left_space_length}000000 + {right_space_length}
    ''.length, // content length
    
    // ''.length, // between
    // ReParser.NEXT,
    // context['expression.function'],
    // '\t\t\n'.length, // left space (2)
    // ''.length, // content
    // '\t\t\n'.length, // right space (3)
    //
    // ''.length, // between
    // ReParser.OUT,
    // context['expression'],
    // '\t\t\n'.length, // left space (2)
    // '', // content
    // '\t\t\n'.length, // right space (3)
    
    
    // предполагаем, что в конце это всегда есть
    // "",
    // ReParser.NONE,
    // undefined,
    // "",
    // {length: undefined},
    // "",
  ];
  
  var p  = new ReParser("A;A");
  
  // p.parse(11, ".expression")
  
  p.parse();
  
});



/*

каждый parsed_token содержит:
- тип (собственное название контекста)
- распарсерый простой контент
-


 */
