let {ReParser} = require('./parser3');
let aop = require('../yucalc3/aop');

let __debug = {};

// __debug.var_context = (eval_fn) => {
//     let colors = require('colors');
//     console.log(('debug var_context on ' + new Error().stack.split("\n")[2]).replace(/:\d+\)/, '').yellow);
//     eval_fn(`console.log('context=', context);`);
//     eval_fn(`console.log('pos=', pos, "idx=", idx);`)
//     // eval_fn(`console.log('"', self.pr.source.substring(pos-5, pos), "|", self.pr.source.substring(pos + 1, pos + 5), '"', )`);
//     aop.debugger();
// };

class ReParserWalker {

  constructor(pr) {
    this.pr = pr;
  }
  
  pos = 0;
  idx = 0;
  context = 'root>';
  
  walk() {
    // console.log('walk()', this);
    let self = this;
    var z, x = new Proxy(this, z = {
      get: function(target, key) {
        // правило:
        
        // function toString() {
  
        `function toString(target, key)`; {
          
          if(key === 'toString' || key === Symbol.toPrimitive || key === require('util').inspect.custom) {
            return () => {
              let pos     = self.pos;
              let idx     = self.idx;
              let context = self.context;
              
              __debug.var_context && __debug.var_context(it=>eval(it));
      
              let start_idx = idx - 1;
              if(start_idx < 0) {
                start_idx = 0;
              }
              let start_pos = pos - self.pr.sum_lengths(self.pr.parsed_path[start_idx]);
              let start_token = self.pr.parsed_path[start_idx];
              let start_context = context.substr(0, context.length - (start_token.context_add || "").length) + start_token.context_cut;
              
              // console.log('start', start_idx, start_pos, start_context);
      
              let token;
              
              // console.log('context', context);
              // console.log(pos, idx, context, self.context.replace(/>$/, ''));
  
              // idx++;
              
              while(context.substr(0, self.context.length) === self.context) {
                
                // console.log(pos, idx, context, self.context.replace(/>$/, ''));
                
                token = self.pr.parsed_path[idx];
                // console.log(idx, token, context);
                if(token && token.context_name !== '_unparsed') {
                  pos += self.pr.sum_lengths(token);
                  context = context.substr(0, context.length - (token.context_cut || "").length) + token.context_add;
                  
                  __debug.var_context && __debug.var_context(it=>eval(it));
                  
                  idx++;
                } else {
                  break
                }
              }
              if(token && token.context_name !== '_unparsed') {
                // go back 1 iteration
                pos -= self.pr.sum_lengths(token);
                context = context.substr(0, context.length - (token.context_add || "").length) + token.context_cut;
                
                __debug.var_context && __debug.var_context(it=>eval(it));
                
                idx--;
              }
              // console.log(pos, idx, context, self.context.replace(/>$/, ''));
              // console.log('pos', pos, self.pos);
              // let start_token = self.pr.parsed_path[self.idx];
              let wrap_betweens_length = start_token.between_spaces_left_length + start_token.between_length + start_token.between_spaces_right_length;
              return self.pr.source.substring(start_pos + wrap_betweens_length, pos);
            }
          }
        }
  
  
        if(typeof key === 'symbol') {
          console.log('walker found symbol key=', key);
          return undefined
        }
  
        if(key === 'constructor') {
          return ReParserWalker
        }
  
  
        let new_walker = new ReParserWalker(self.pr);
        let pos     = self.pos;
        let idx     = self.idx;
        let context = self.context;
        
        __debug.var_context && __debug.var_context(it=>eval(it));
  
        `function getArrayItemByIdx(key)`;{
          
          if(Number(key).toString() === key) { // если это число
            key = Number(key);
            // console.log('nbumber', key);
            // ni("если мы в контексте [], то ищем N-ное вхождение и устанавливаем arrIdx. иначе кидаем эксепшн");
            // console.log(context, pos, idx);
            if(context.endsWith("[]>")) {
              let token = self.pr.parsed_path[idx];
              pos += self.pr.sum_lengths(token);
              context = context.substr(0, context.length - (token.context_cut || "").length) + token.context_add;
              idx++;
              __debug.var_context && __debug.var_context(it=>eval(it));
              let context_save = context;
        
              // console.log('pipii', idx, token, context);
        
              let
                start_context = context_save.replace(/>$/, '') // cut ending ">"
                , i = 0;
        
              while(context >= start_context) {
                // console.log('kukuu', start_context, context, context_save, i, key);
                if(context === start_context + ">") {
                  if(i === key) {
                    new_walker.pos = pos;
                    new_walker.idx = idx;
                    new_walker.context = context;
                    return new_walker.walk();
                  } else {
                    i++
                  }
                }
                let token = self.pr.parsed_path[idx];
                // console.log(idx, token, context);
                pos += self.pr.sum_lengths(token);
                context = context.substr(0, context.length - (token.context_cut || "").length) + token.context_add;
                idx++;
                __debug.var_context && __debug.var_context(it=>eval(it));
                // console.log('new_context', context);
              }
              // console.log('mumu', context, start_context, 'zazu',
              //   context.substr(0, context.length - (self.pr.parsed_path[idx+1].context_cut || "").length) + self.pr.parsed_path[idx+1].context_add
              // );
              // console.log('lulu', context.substr(0, context.length - (self.pr.parsed_path[idx+1].context_cut || "").length) + self.pr.parsed_path[idx+1].context_add);
        
              return
              // throw new Error('Out of range, max value is ' + (i - 1));
        
            } else {
              throw new Error("Can't get index on a non-array context ( should be /../.../abc[] )");
            }
      
            pni("Если xxx – массив, то возвращаем массив. нужно уметь обрабатывать length и итерировать, доступ к свойствам через xxx[index] ");
          }
        }
        
        `function findParentNode(key)`;{
          
          if(key[0] === '$') {
            ni("Если первый символ доллар $aaa, идем влево (вниз по вложенности) до www/aaa и возвращаем получившееся");
            // while(self.pr.path[idx]) {
            //
            // }
            // new_walker.pos     = pos;
            // new_walker.idx     = idx;
            // new_walker.context = context;
            // return new Proxy(new_walker, z);
          }
        }
  
        
        let deepestContextSearch = self.pr.parsed_path[idx].context_name.match(/^\/?[^/]+>\/[^/]+>/);
        if(!deepestContextSearch) {
          deepestContextSearch = self.pr.parsed_path[idx].context_name;
          pni('Похоже, мы в самом корне. Полагаем, что мы ищем первое вхождение токена. Нужно перепроверить эту логику');
        }

        // ni("Например, ищем токен xxx. Идем влево (вниз по вложенности) до конструкции вида sss/bbb – это будет корень текущего семпла");
  
  
        let depth = 0;
        let targetContextDepth;
        
        do {
          pos     = self.pos;
          idx     = self.idx;
          context = self.context;

          __debug.var_context && __debug.var_context(it=>eval(it));

          let token;
          targetContextDepth = context;
          pni("Здесь написана какая-то херня – такой алгоритм не будет работать :) нужно продумать логику лучше");
          for(let i = depth; i-- && targetContextDepth;) {
            targetContextDepth = targetContextDepth.replace(/\/[^/]+>?$/, '');
            // console.log(targetContextDepth, depth, i);
          }
          while(context >= deepestContextSearch && context >= targetContextDepth && idx > 0) {
            idx--;
            token = self.pr.parsed_path[idx];
            pos -= self.pr.sum_lengths(token);
            context = context.substr(0, context.length - (token.context_add || "").length) + token.context_cut; // back direction
            __debug.var_context && __debug.var_context(it=>eval(it));
          }
          if(token) {
            // прошли слишком далеко, возвращаемся на итерацию
            pos += self.pr.sum_lengths(token);
            context = context.substr(0, context.length - (token.context_cut || "").length) + token.context_add;
            __debug.var_context && __debug.var_context(it=>eval(it));
            idx++;
          }
          
          let finish_context = context.replace(/>$/, '');
          while(context.startsWith(finish_context)) {
            token = self.pr.parsed_path[idx];
            pos += self.pr.sum_lengths(token);
            // console.log(context, token.context_cut, token.context_add, context.length - (token.context_cut || "").length,
            //   token.context_cut,
            //   context.substr(0, context.length - (token.context_cut || "").length) + token.context_add);
            context = context.substr(0, context.length - (token.context_cut || "").length) + token.context_add;
            idx++;
            __debug.var_context && __debug.var_context(it=>eval(it));
            // console.log(context, idx, depth);
            if(context.endsWith("/" + key) || context.endsWith("/" + key + ">" ) || context.endsWith("/" + key + "[]>") ) {
              new_walker.pos      = pos;
              new_walker.idx      = idx;
              new_walker.context  = context;
              return new_walker.walk();
            }
          }
          
          // ni("смотрим, нет ли такого токена в нашем контексте. если нет, поднимаемся на уровень выше. и так далее, до /A/B (двойная вложенность)")
          
          // if(!context.deepestContextSearch) {
          //   throw new Error("Cannot find the context");
          // }
  
          depth++;
  
        } while(true);
        
        let token;
        while(
          idx >= 0 &&
          (token = self.pr.parsed_path[idx]).context_name > subRootPattern // string comparison
        ) {
          pos -= self.pr.sum_lengths(token);
          idx--;
          context = context.substr(0, context.length - (token.context_add || "").length) + token.context_cut; // back direction
          __debug.var_context && __debug.var_context(it=>eval(it));
        }
        idx ++; // проехали капельку мимо
  
        let subContext = context;
  
        // ni("Дальше просматриваем весь контекст, начинающийся с sss/bbb, и ищем токен xxx. отличные от sss/bbb пропускаем, до тех пор пока наш контекст не кончился");
  
        while(context >= subContext && (token = self.pr.parsed_path[idx]) ) {
          pos += self.pr.sum_lengths(token);
          context = context.substr(0, context.length - (token.context_cut || "").length) + token.context_add; // back direction
          __debug.var_context && __debug.var_context(it=>eval(it));
          if(context.endsWith(key) || context.endsWith(key + ">") || context.endsWith(key + "[]>") ) {
            break
          } else {
            idx++;
          }
        }
        
        
        new_walker.pos     = pos;
        new_walker.idx     = idx;
        new_walker.context = context;
        // console.log('new_walker', new_walker);
        return new_walker.walk();
      }
    });
    return x;
  }
}

false && aop.test(function() {
  let pr = new ReParser(`
      SumIf(
                  Received_recoveries:Total_recovery_received_from_reinsurer,
                  :Claim_num = Claim_num,
                  :Category = APRA_Class_Code_Adj
              )
  `);
  
  
  pr.parse();
  
  let prwalker = new ReParserWalker(pr);
  let walker = prwalker.walk();
  
  console.log(walker);
  console.log(walker.lookup.filter[1])
  
  // console.log(pr);
  
});

aop.test(function() {
  let pr = new ReParser(`
    SumIf(non_CAT_retention_lookup:Treaty_identifier,
      :Partners_affected in set(Partner_Group, "H40B"),
      :Classes         == APRA_class_code,
      :Year_Commencing <= new Date(Innuring_2_Applicable_Date),
      :Year_ending     >= new Date(Innuring_2_Applicable_Date),
      :Attachment_Type == "Risk Attaching",
      :Inurring__2     == "Y");
  `);


  pr.parse();

  let prwalker = new ReParserWalker(pr);
  let walker = prwalker.walk();

  console.log(walker);
  console.log('walker.lookup', walker.lookup);
  console.log('walker.lookup.filter[0]', walker.lookup.filter[0]);
  console.log('walker.lookup.filter[1]', walker.lookup.filter[1]);
  
  // console.log(pr);
  
});



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

module.exports.ReParserWalker = ReParserWalker;