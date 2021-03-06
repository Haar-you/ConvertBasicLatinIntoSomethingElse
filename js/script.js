const Node = function(value, parent){
    this.value = value;
    this.next = new Array();
    this.parent = parent;
};

const Tree = function(){
    this.root = new Node(null, null);
    this.curNode = this.root;
};

Tree.prototype.init = function(){
    this.root = new Node(null, null);
    this.curNode = this.root;
};

Tree.prototype.put = function(input, output){
    let cur = this.root;

    $.each(input, function(index, val){
	if(val in cur.next){
	    cur = cur.next[val];
	}else{
	    const temp = new Node(null, cur);
	    cur.next[val] = temp;
	    cur = temp;
	}
    });

    cur.value = output;
};

Tree.prototype.replace = function(input){
    const search = function(node, str, his, cnt){

	if(str.length > 0){
	    const head = str[0];
	    const tail = str.slice(1);
	    
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
    
    const lines = input.split(/\r|\n|\r\n/);
    const root = this.root;
    let output = [];

    $.each(lines, function(index, val){
	let temp;
	let str = val.split('').map(x => x.charCodeAt(0));
	let i = 0;
	let result = [];

	
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

const tree = new Tree();

function split_char(str){
    return str.split('').map(x => x.charCodeAt(0));
}

function constructTree(path){
    tree.init();

    let dict = [];

    function displayHelper(){
	dict.sort((a,b) => {return a["in"] > b["in"];});

	$("#tree").html("");
	
	$.each(dict, function(index, val){

	    $("#tree").append(
		$("<div></div>", {title: val["description"]}).append(
		    $("<button></button>", {
			"class": "treeInput",
			text: val["in"],
			on: {
			    click: function(){
				const text = $("#input").val();
				$("#input").val(text+val["in"]);
			    }
			}
		    }),
		    $("<span></span>", {text: "→"}),
		    $("<span></span>", {"class": "treeOutput", text: val["out"]}),
		)
	    )
	});
    }

    
    $.getJSON("./json/common.json", function(dat){
	dat["data"].forEach(val => {
	    if(!val.type){
		dict.push(val);
	    }
	    tree.put(
		val["in"].split('').map(x => x.charCodeAt(0)),
		val["out"].split('').map(x => x.charCodeAt(0))
	    );
	});

	displayHelper();
    });

    $.getJSON(`./json/${path}`, function(dat){
	dat["data"].forEach(val => {
	    dict.push(val);
	    tree.put(
		val["in"].split('').map(x => x.charCodeAt(0)),
		val["out"].split('').map(x => x.charCodeAt(0))
	    );
	});
	displayHelper();
    });    
}

var params = {};

$(function(){
    const search = window.location.search;
    const p = search.split("&");
    $.each(p, function(i,v){
	const m = v.match(/^\??([\w-% ]+)=([\w-% ]*)$/);
	if(m){
	    params[m[1]] = decodeURI(m[2]);
	}
    });
});



$(document).ready(function(){
    $.getJSON("./js/reference.json", function(dat){
	$.each(dat["script-name"], function(index, val){
	    $("#contentLanguageSelect").append(
		$("<div></div>", {"class": "dropright "}).append(
		    $("<a></a>", {
			href: "#",
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
			updateURLParameter("lang", val["symbol"]);
			$("#modalReference").modal("hide");
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

    if(params["font-size"]) $("#output").css("font-size", params["font-size"]);
    if(params["writing-mode"]) $("#output").css("writing-mode", params["writing-mode"]);
    if(params["direction"]) $("#output").css("direction", params["direction"]);
    

    $("#input").keydown(function(e){
	//Firefox
	if(e.ctrlKey && e.keyCode == 13){ //Ctrl + Enter
	    convert();
	    if(e.shiftKey){ //Ctrl + Shift + Enter
		copyOutput();
	    }
	}
    });
});

function copyOutput(){
    $("#output").select();
    document.execCommand('copy');
}

function convert(){
    const textInput = $("#input").val();
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

function paramsToURL(p){
    let ret = "";

    for(key in params){
	ret += key + "=" + encodeURI(params[key]) + "&";
    }

    return ret;
}

/*
  urlパラメータ関係
*/

function updateURLParameter(key, value){
    params[key] = value;
    history.replaceState("","","?"+paramsToURL(params));
}


/*
  書記方向の変更
*/

function changeWritingDirectionVerticalLR(){
    $("#output").css({"writing-mode": "vertical-lr", "direction": "ltr"});
    updateURLParameter("writing-mode", "vertical-lr");
    updateURLParameter("direction", "ltr");
}

function changeWritingDirectionVerticalRL(){
    $("#output").css({"writing-mode": "vertical-rl", "direction": "ltr"});
    updateURLParameter("writing-mode", "vertical-rl");
    updateURLParameter("direction", "ltr");
}

function changeWritingDirectionHorizontalLR(){
    $("#output").css({"writing-mode": "horizontal-tb", "direction": "ltr"});
    updateURLParameter("writing-mode", "horizontal-tb");
    updateURLParameter("direction", "ltr");
}

function changeWritingDirectionHorizontalRL(){
    $("#output").css({"writing-mode": "horizontal-tb", "direction": "rtl"});
    updateURLParameter("writing-mode", "horizontal-tb");
    updateURLParameter("direction", "rtl");
}


/*
  フォントの変更
*/

function changeFontSize(value){
    $("#output").css({"font-size": value});
    updateURLParameter("font-size", value);
}




