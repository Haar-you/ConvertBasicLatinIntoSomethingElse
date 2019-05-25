var Node = function(value, parent){
    this.value = value;
    this.next = new Array();
    this.parent = parent;
};

var Tree = function(){
    this.root = new Node(null, null);
    this.curNode = this.root;
};

Tree.prototype.init = function(){
    this.root = new Node(null, null);
    this.curNode = this.root;
};

Tree.prototype.put = function(input, output){
    var cur = this.root;

    $.each(input, function(index, val){
	if(val in cur.next){
	    cur = cur.next[val];
	}else{
	    var temp = new Node(null, cur);
	    cur.next[val] = temp;
	    cur = temp;
	}
    });

    cur.value = output;
};

Tree.prototype.show = function(){
    var elems = [];
    var _show = function(node, his, depth){
	node.next.forEach(function(val, key){
	    var input = his + String.fromCharCode(key);
	    var output = escape( String.fromCharCode.apply(null, node.next[key].value));

	    if(node.next[key].value != null)
		elems.push(
		    $("<div></div>").append(
			$("<span></span>", {"class": "treeInput", text: input}),
			$("<span></span>", {text: "→"}),
			$("<span></span>", {"class": "treeOutput", text: output}),
		    )
		);
	    _show(node.next[key], input, depth+1);
	});
    };

    _show(this.root, "", 0);

    return elems;
};


Tree.prototype.replace = function(input){
    var search = function(node, str, his, cnt){

	if(str.length > 0){
	    var head = str[0];
	    var tail = str.slice(1);
	    
	    if(head in node.next){
		return search(node.next[head], tail, his.concat([head]), cnt+1);
	    }else{
		if(cnt == 0){
		    return [tail, (node.value != null) ? node.value : [head]];
		}else{
		    return [str, (node.value != null) ? node.value : his];
		}
	    }
	}else{
	    return [null, (node.value != null) ? node.value : his];
	}
    };
    var lines = input.split(/\r|\n|\r\n/);
    var root = this.root;
    var output = [];

    $.each(lines, function(index, val){
	var temp;
	var str = val.split('').map(x => x.charCodeAt(0));
	var i = 0;
	var result = [];

	
	while(true){
	    temp = search(root, str, [], 0);
	    Array.prototype.push.apply(result, temp[1]);
	    str = temp[0];

	    ++i; if(i>1000) break; //無限ループ回避用 (1行1000文字以下を想定)
	    
	    if(str == null) break;
	}
	output.push(String.fromCharCode.apply(null, result));
    });

    return output.join("\n");
};

var tree = new Tree();

function split_char(str){
    return str.split('').map(x => x.charCodeAt(0));
}

function constructTree(path){
    tree.init();

    $.getJSON(`./json/${path}`, function(dat){

	tree.put(split_char("#"), split_char(""));
	tree.put(split_char("##"), split_char("‌"));

	
	
	$.each(dat["data"], function(index, val){
	    tree.put(
		val["in"].split('').map(x => x.charCodeAt(0)),
		val["out"].split('').map(x => x.charCodeAt(0))
	    );
	});
	var elems = tree.show();
	$("#tree").html("");
	elems.forEach(elem => {
	    $("#tree").append(elem);
	});
    });
}

var params = {};

$(function(){
    var search = window.location.search;
    var p = search.split("&");
    $.each(p, function(i,v){
	var m = v.match(/^\??([\w-% ]+)=([\w-% ]*)$/);
	if(m){
	    params[m[1]] = decodeURI(m[2]);
	}
    });
    console.log(params);
});

$(document).ready(function(){

    $.getJSON("./js/reference.json", function(dat){

	$.each(dat["script-name"], function(index, val){
	    $("#dropdownReference").append(
		$("<div></div>", {"class": "dropright "}).append(
		    $("<a></a>", {
			href: "#",
			on:{
			    mouseover: function(){
				$(`#divScript${val["code"]}`).dropdown("show");
			    },
			    mouseleave: function(){
				setTimeout(
				    function(){
					const hvs = $(":hover");
					if(!$($(hvs[hvs.length-1]).parent()[0]).is($(`#divScript${val["code"]}`))){
					    $(`#divScript${val["code"]}`).dropdown("hide");
					}
				    }, 300
				);
			    },
			},
			"class": "btn dropdown-item dropdown-toggle",
			"data-toggle": "dropdown",
			role: "button",
			text: val["name"],
			id: `dropdownScript${val["code"]}`
		    }),
		    $("<div></div>", {
			"class": "dropdown-menu",
			"aria-labelledby": `dropdownScript${val["code"]}`,
			id: `divScript${val["code"]}`,
			on: {
			    mouseleave: function(){
				$(`#divScript${val["code"]}`).dropdown("hide");
			    }
			}
		    })
		)
	    );
	});

	
	$.each(dat["reference"], function(index, val){
	    const lang_btn = $(`<a></a>`, {
		href: "#",
		"class": "dropdown-item",
		on: {
		    click: function(){
			constructTree(val["file"]);
		    }
		},
		text: val["name"]
	    });
	    
	    $(`#divScript${val["script"]}`).append(
		lang_btn
	    );

	    if(val["symbol"] == params["lang"]){
		lang_btn.click();
	    }
	});
    });


    $("#btnReference").click(function(){
    });

    $("#btnFontSizeSelector").click(function(){
    });

    $("#input").keydown(function(e){
	//Firefox
	if(e.ctrlKey && e.keyCode == 13){ //Ctrl + Enter
	    $("#convert").click();
	    if(e.shiftKey){ //Ctrl + Shift + Enter
		$("#output").select();
		document.execCommand('copy')
	    }
	}
    });
});


function convert(){
    var textInput = $("#input").val();
    $("#output").val(tree.replace(textInput));
}

function escape(str){
    return str.replace(/[<>]/g, function(m){
	return {
	    "<": "&lt;",
	    ">": "&gt;"
	}[m];
    });
}
