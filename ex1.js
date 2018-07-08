function ListNode(val) {
  this.val = val;
  this.next = null;
}

// var addTwoNumbers = function(l1, l2) {
//   // re-use l1 to economy a bit memory and time
//   var current_node = {next: l1};
//   var sum_digits = 0;
//   var i, node;
//   var nodes_to_sum = [l1,l2];
//
//   while(nodes_to_sum.length || sum_digits) {
//     for(i = nodes_to_sum.length; i--;) {
//       node = nodes_to_sum[i];
//       sum_digits += node.val;
//       if(!(nodes_to_sum[i] = node.next)) {
//         nodes_to_sum.splice(i, 1);
//       }
//     }
//     if(!current_node.next) {
//       current_node.next = new ListNode(sum_digits % 10)
//     } else {
//       current_node.next.val = sum_digits % 10
//     }
//     current_node = current_node.next;
//     sum_digits = (sum_digits - current_node.val) / 10;
//     if(nodes_to_sum.length || sum_digits) {
//       current_node.next = new ListNode(0)
//       current_node = current_node.next;
//     }
//   }
//
//   return l1;
// };

var addTwoNumbers = function(l1, l2, c = l1) { // re-use l1 to economy a bit memory and time
  while(l1) {
    if(l2) {
      l1.val += l2.val;
      l2 = l2.next
    } else {
      if(l1.val < 10) {
        return c
      }
    }
    if(!l1.next) {
      if(l2) {
        l1.next = l2;
        l2 = null;
      } else if(l1.val >= 10) {
        l1.next = {val: 1}; // we can avoid calling a constuctor
        l1.val = l1.val - 10;
      }
    }
    if(l1.val >= 10) {
      l1.next.val += 1;
      l1.val -= 10;
    }
    l1 = l1.next
  }
  return c;
};


// var addTwoNumbers = function(l1, l2, c = l1) { // re-use l1 to economy a bit memory and time
//   while(l1) {
//     if(l2) {
//       l1.val += l2.val;
//       l2 = l2.next;
//     }
//     if(!l1.next) {
//       if(l2 || l1.val >= 10) {
//         l1.next = {val: 0}; // we can avoid calling a constuctor
//       }
//     }
//     if(l1.val >= 10) {
//       console.log('going going');
//       l1.next.val += (l1.val - (l1.val % 10)) / 10;
//     }
//     l1.val %= 10;
//     l1 = l1.next
//   }
//
//   return c;
// };


// l1 = new ListNode(2);
// l1.next = new ListNode(4);
// l1.next.next = new ListNode(3);
//
// l2 = new ListNode(5);
// l2.next = new ListNode(6);
// l2.next.next = new ListNode(4);
//
//
// console.log(addTwoNumbers(l1, l2));

l1 = new ListNode(5);

l2 = new ListNode(5);


console.log(addTwoNumbers(l1, l2));


l1 = new ListNode(1);

l2 = new ListNode(9);
l2.next = new ListNode(9);


console.log(addTwoNumbers(l1, l2));



// var addTwoNumbers = function(l1, l2) {
//     // re-use l1 to economy a bit memory and time
//     var current_node = {next: l1};
//     var sum_digits = 0;
//     var i, node;
//     var nodes_to_sum = [l1,l2];

//     while(nodes_to_sum.length || sum_digits) {
//         for(i = nodes_to_sum.length; i--;) {
//             node = nodes_to_sum[i];
//             sum_digits += node.val;
//             if(!(nodes_to_sum[i] = node.next)) {
//                 nodes_to_sum.splice(i, 1);
//             }
//         }
//         if(!current_node.next) {
//             current_node.next = new ListNode(sum_digits % 10)
//         } else {
//             current_node.next.val = sum_digits % 10
//         }
//         current_node = current_node.next;
//         sum_digits = (sum_digits - current_node.val) / 10;
//     }

//     return l1;
// };

// var addTwoNumbers = function(l1, l2) {
//     var l0 = new ListNode(0);
//     var current_node = l0;
//     var sum_digits = 0;

//     var nodes_to_sum = [l1,l2];

//     while(nodes_to_sum.length || sum_digits) {
//         for(var i = 0; i < nodes_to_sum.length; i++) {
//             var node = nodes_to_sum[i];
//             sum_digits += node.val;
//             nodes_to_sum[i] = nodes_to_sum[i].next;
//             if(!nodes_to_sum[i]) {
//                 nodes_to_sum.splice(i, 1);
//                 i--;
//             }
//         }
//         current_node.val = sum_digits % 10;
//         sum_digits = (sum_digits - current_node.val) / 10;
//         if(nodes_to_sum.length || sum_digits) {
//             current_node.next = new ListNode(0)
//             current_node = current_node.next;
//         }
//     }

//     return l0;
// };