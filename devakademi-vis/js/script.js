
var w = window.innerWidth;
var h = window.innerHeight;

var keyc = true, keys = true, keyt = true, keyr = true, keyx = true, keyd = true, keyl = true, keym = true, keyh = true, key1 = true, key2 = true, key3 = true, key0 = true

var focus_node = null, highlight_node = null;

var text_center = false;
var outline = false;

var min_score = 0;
var max_score = 1;

var color = d3.scale.linear()
    .domain([min_score, (min_score+max_score)/2, max_score,2])
    .range(["#656565", "#656565", "#656565","#58ACFA"]);

var highlight_color = "#5882FA"; // stroke olacak renk
var highlight_trans = 0.07;

var size = d3.scale.pow().exponent(1)
    .domain([1,100])
    .range([8,24]);

var force = d3.layout.force()
    .linkDistance(500)
    .charge(-300)
    .size([w,h])
    .stop();

var tags_queue=[];
var tags_indexBank=[];
var noneUniqTags=[];

var default_node_color = "#656565";
//var default_node_color = "rgb(3,190,100)";
var default_link_color = "#888";
var nominal_base_node_size = 2;
var nominal_text_size = 10;
var max_text_size = 24;
var nominal_stroke = 1.5;
var max_stroke = 4.5;
var max_base_node_size = 36;
var min_zoom = 0;
var max_zoom = 32;
var svg = d3.select("body").append("svg");
var zoom = d3.behavior.zoom().scaleExtent([min_zoom,max_zoom])
var g = svg.append("g");
svg.style("cursor","move");

d3.json("data/graph.json", function(error, graph) {
    var linkedByIndex = {};
    graph.links.forEach(function(d) {
        linkedByIndex[d.source + "," + d.target] = true;
    });

    var fikir = document.getElementById("dropdownmenu");
    var btnIdea = document.createElement("button");

    dropdownmenu_clear();

   // reFill();

    function reFill(){
        graph.ideas.forEach(function(d) {
            create_dropdown(d);
        });
        addPanelPadding();
    }

    function isConnected(a, b) {
        return (
            linkedByIndex[a.index + "," + b.index]
                || linkedByIndex[b.index + "," + a.index]
                    || a.index == b.index);
    }

    function hasConnections(a) {
        for (var property in linkedByIndex) {
            s = property.split(",");
            if ((s[0] == a.index || s[1] == a.index) && linkedByIndex[property]) {
                return true;
            }
        }
        return false;
    }

    force
        .nodes(graph.nodes)
        .links(graph.links);

    force.start();
    for (var i = 300; i > 0; --i){ force.tick();}
    force.stop();


    var link = g.selectAll(".link")
        .data(graph.links)
        .enter().append("line")
        .attr("class", "link")
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; })
        .style("stroke-width",nominal_stroke)
        .style("opacity",1)
        .style("stroke", function(d) {
            if (isNumber(d.score) && d.score>=0) return color(d.score);
            else return default_link_color; })

    var tocolor = "fill";
    var towhite = "stroke";
    if (outline) {
        tocolor = "stroke"
        towhite = "fill"
    }

    var rect = g.selectAll(".rect")
        .data(graph.nodes)
        .enter().append("rect")
        .attr("fill","white")
        .attr("ry", "5px")
        .attr("x","0")
        .attr("y","-10")
        .style("display","none")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });



    var text = g.selectAll(".text")
        .data(graph.nodes)
        .enter().append("text")
        .attr("dy", ".35em")
        .style("font-size", nominal_text_size + "px")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });


    if (text_center)
        text.text(function(d) { return d.id; }).style("text-anchor", "middle");
    else{
        text.attr("dx", function(d) {return (size(d.size)||nominal_base_node_size);})
            .text(function(d) { return '\u2002'+d.id; });

        rect.style("width",function(d) {
         if(d.id.length<=5)
            return d.id.length*12;
         else return d.id.length*10; });

    }

    var node = g.selectAll(".node")
        .data(graph.nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("cx", function(d) { return d.x; }).attr("cy", function(d) { return d.y; })
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
        //.call(force.drag);

    node.on("dblclick.zoom", function(d) {
        d3.event.stopPropagation();
    });

    // Okunan verilerden Node özelliklerinin yaratılması.
    // d.size = node boyutu
    // d.score = ait olunan grup
    // d.id = Node idsi // ismi
    // d.type = Node şekli {circle,square}
    var circle = node.append("path")
        .attr("d", d3.svg.symbol()
            .size(function(d) { return Math.PI*Math.pow(size(d.size)||nominal_base_node_size,2);})
            .type(function(d) { return "circle"; })) //return d.type;

        .style(tocolor, function(d) {
            if (isNumber(d.score) && d.score>=0) return color(d.score);
            else return default_node_color; })
        .style("stroke-width", nominal_stroke)
        .style(towhite, "white");


    node.on("mouseover", function(d) {
        //set_highlight(d);
        svg.style("cursor","pointer");
    }).on("mousedown", function(d) {
            focus_node = d;
            if (highlight_node === null) set_highlight(d);
            if(tags_queue.includes(d)){
                circle.style(towhite, "white");
                text.style("font-weight", "normal");
                rect.style("display","none");
                link.style("stroke", function(o) {return (isNumber(o.score) && o.score>=0)?color(o.score):default_link_color});

                circle.style(towhite, function(o) { return isConnected(tags_queue[0], o) ? highlight_color : "white";});
                text.style("font-weight", function(o) { return isConnected(tags_queue[0], o) ? "bold" : "normal";});
                rect.style("display", function(o) { return tags_queue[0]==o ? "block" :"none";});
                link.style("stroke", function(o) {
                    return o.source.index == tags_queue[0].index || o.target.index == tags_queue[0].index ? highlight_color : ((isNumber(o.score) && o.score>=0)?color(o.score):default_link_color);
                });
            }
            set_focus(d);
            if(tags_queue.length==0)clear_focus();
        }).on("mouseout", function(d) {
            exit_highlight();
        });

    function set_highlight(d)
    {
        svg.style("cursor","pointer");
        if (focus_node!==null) d = focus_node;
        highlight_node = d;

        if (highlight_color!="white")
        {
            circle.style(towhite, function(o) { return isConnected(d, o) ? highlight_color : "white";});
            text.style("font-weight", function(o) { return isConnected(d, o) ? "bold" : "normal";});
            rect.style("display", function(o) { return d==o ? "block" :"none";});
            link.style("stroke", function(o) {
                return o.source.index == d.index || o.target.index == d.index ? highlight_color : ((isNumber(o.score) && o.score>=0)?color(o.score):default_link_color);
            });
        }
    }
    function exit_highlight(){
        svg.style("cursor","move");
        highlight_node = null;
        if (focus_node===null){
            if (highlight_color!="white"){
                circle.style(towhite, "white");
                text.style("font-weight", "normal");
                rect.style("display","none");
                link.style("stroke", function(o) {return (isNumber(o.score) && o.score>=0)?color(o.score):default_link_color});
            }
        }
    }

    function set_focus(d)
    {
      console.log(d);
        dropdownmenu_clear();

        if(tags_queue.includes(d))
            tags_queue.splice(tags_queue.indexOf(d),1);
        else{
            if(!noneUniqTags.includes(d) && noneUniqTags.length!=0){
                tags_queue=[];
                noneUniqTags=[];
            }
            tags_queue.push(d);
        }

        markingNode(tags_queue);

        createTagsView(tags_queue);

        coloringNode();

        fillDropdown();

        highlighter(tags_queue);
        if(tags_queue.length==0){dropdownmenu_clear();}
    }

    function fillDropdown(){
        if(getFilteredIdea())
            if(getFilteredIdea().length!=0)
                document.getElementById("countOfIdea").innerHTML="<font size='4em'>"+getFilteredIdea().length+" </font>Kayıt Mevcut.";
            else
                document.getElementById("countOfIdea").innerHTML="Fikir bulunamadı.";
        else
             document.getElementById("countOfIdea").innerHTML="<font size='4em'>180 </font>fikir mevcut.";

        var maxVisibleText=20;
        if(getFilteredIdea().length<20)
            maxVisibleText= getFilteredIdea().length;

        for(var i=0;i<maxVisibleText;i++)
            create_dropdown(graph.ideas[getFilteredIdea()[i]]);
        addPanelPadding();

        if(getFilteredIdea())
        if(getFilteredIdea().length==0)
            document.getElementsByClassName("hasIdeas")[0].style.display="inline";
        else
            document.getElementsByClassName("hasIdeas")[0].style.display="none";
    }

    jQuery(".search-icon").click(function(){
        searchToggle(this, event);
    });

    jQuery(".close").click(function(){
        searchToggle(this, event);
    });
    jQuery(".reload").click(function(){
       // Yenile metodunun çağrılacağı yer.
       clear_focus();
       keyc=true;
       keys=true;
       keyt=true;
       $('#category1').prop('checked', true);
       $('#category2').prop('checked', true);
       $('#category3').prop('checked', true);
        link.style("display", function(d) {
            var flag  = vis_by_type(d.source.type)&&vis_by_type(d.target.type)&&vis_by_node_score(d.source.score)&&vis_by_node_score(d.target.score)&&vis_by_link_score(d.score);
            linkedByIndex[d.source.index + "," + d.target.index] = flag;
            return flag?"inline":"none";});
        node.style("display", function(d) {
            return (key0||hasConnections(d))&&vis_by_type(d.type)&&vis_by_node_score(d.score)?"inline":"none";});
        text.style("display", function(d) {
            return (key0||hasConnections(d))&&vis_by_type(d.type)&&vis_by_node_score(d.score)?"inline":"none";});
         document.getElementById("countOfIdea").innerHTML="<font size='4em'>180 </font>fikir mevcut.";

    });
    jQuery(".settings").click(function(){
        if(document.getElementsByClassName('winFilter')[0].style.display=="inline" ){
            document.getElementsByClassName('winFilter')[0].style.display="none";
            this.style="border-bottom:none";
        }else{
            document.getElementsByClassName('winFilter')[0].style.display="inline";
            this.style="border-bottom: 2px solid #3498db";
        }
    });



    $("form").submit(function(event) { event.preventDefault(); submitFn(this, event);});


    function searchToggle(obj, evt){
        var container = $(obj).closest('.search-wrapper');
        if(!container.hasClass('active')){
              container.addClass('active');
              evt.preventDefault();
        }else if(container.hasClass('active') && $(obj).closest('.input-holder').length == 0){
              container.removeClass('active');
              container.find('.search-input').val('');
        }
    }

    function submitFn(obj, evt){
        value = $(obj).find('.search-input').val().trim();
        var say=0;
        if(value.length)
            for(var infoNode in graph.nodes)
                if(value.trim().toLowerCase()===(graph.nodes[infoNode].id).trim().toLowerCase())
                    if(!tags_queue.includes(graph.nodes[infoNode])){
                        tags_queue.push(graph.nodes[infoNode]);
                        say++;
                    }
                    console.log(tags_queue);
                    console.log(value);
        if(say!=0){
            dropdownmenu_clear();
            coloringNode();
            markingNode(tags_queue);
            createTagsView(tags_queue);
            fillDropdown();
            highlighter(tags_queue);
            $(obj).find('.search-input').val('');
            $(obj).find('.result-container').css("display:none");
        }else{
            if(value==''){
                $(obj).find('.result-container').html('<span>Lütfen bir kelime giriniz.</span>');
                $(obj).find('.result-container').fadeOut(0);
                $(obj).find('.result-container').fadeIn(100);
                $(obj).find('.result-container').fadeOut(4000, function(){$(this).empty();});
            }else{
                $(obj).find('.result-container').html('<span> Aradığınız kelimeyi bulamadık.</span>');
                 $(obj).find('.result-container').fadeOut(0);
                $(obj).find('.result-container').fadeIn(100);
                $(obj).find('.result-container').fadeOut(4000, function(){$(this).empty();});
            }

        }
        evt.preventDefault();

    }
   $(".search-icon").click(function(){
        $(".result-container").stop();
    });

    function highlighter(tags_queue){
        var instance = new Mark(document.querySelector("#dropdownmenu"));
        instance.unmark("#dropdownmenu");
        for(var i=0 in tags_queue)
        instance.mark(tags_queue[i].id, {
            "caseSensitive": false,
            "ignoreJoiners": true,
            "acrossElements": true,
            "debug": true
        });
    }

    function createTagsView(tags_queue){
        document.getElementById("tags").innerHTML = '';
        fikir = document.getElementById("tags");
        var ul=document.createElement("ul");
        for(var i=0 in tags_queue){
            var li=document.createElement("li");
            var a=document.createElement("a");
            var span=document.createElement("span");
            span.className="tagspan";
            span.textContent=tags_queue[i].id;
            li.appendChild(a);
            a.appendChild(span);
            ul.appendChild(li);
        }
        fikir.appendChild(ul);
        a_clickEvent();
    }

    function a_clickEvent(){
        document.getElementById("dropdownmenu").innerHTML = '';
        var elements = document.getElementsByClassName('tagspan');
        for(var i = 0, len = elements.length; i < len; i++)
            elements[i].onclick = function () {
                for(var infoNode in graph.nodes)
                    if(this.textContent==graph.nodes[infoNode].id)
                       var tempNode=graph.nodes[infoNode];
                tags_queue.splice(tags_queue.indexOf(tempNode),1);
                coloringNode();
                markingNode(tags_queue);
                createTagsView(tags_queue);
                fillDropdown();
                highlighter(tags_queue);
            }
    }

    function getFilteredIdea(){ // filtrelenmiş fikirleri getir.
        if(tags_queue[0]!=null){
            var dummy=tags_queue[0].indexID.split(",");
            dummy.splice(dummy,50);
            for(var i=1 in tags_queue){
                dummy= $.arrayIntersect(dummy, tags_queue[i].indexID.split(","));

            }
            return dummy;
        }
    }

    function coloringNode(){ // Nodeları tıklandığında maviye çevirir.
        circle.style("fill", function(o) {
            if(tags_queue.includes(o)) return color(2);
            else
                if (isNumber(o.score) && o.score>=0) return color(o.score);
                else return default_node_color;
        });
    }

    function markingNode(queue){ //Ortak ilişkili notları parlat;
        if (queue.length==0){
            circle.style("opacity",1);
            text.style("opacity",1);
            link.style("display","inline");
            return;
        } else {
            noneUniqTags=findTargets(queue[0]);
            for (var i = 0; i < queue.length; i++)
                noneUniqTags= $.arrayIntersect(noneUniqTags, findTargets(queue[i]));
        }

        tags_indexBank=[];
        for(var element in noneUniqTags)
            tags_indexBank.push(noneUniqTags[element].index);

        if (highlight_trans<1)  {
            circle.style("opacity", function(o) { return noneUniqTags.includes(o) ? 1 : highlight_trans;});
            text.style("opacity", function(o) {  return noneUniqTags.includes(o) ? 1 : highlight_trans;});
            link.style("display", function(o) {  return (tags_indexBank.includes(o.source.index) &&  tags_indexBank.includes(o.target.index) ) ? "inline" : "none";});
        }
    }

    $.arrayIntersect = function(a, b){ // Ortak geçen elemanları bulur.
      return $.grep(a, function(i){return $.inArray(i, b) > -1; });
    };

    function findTargets(d){ // Gidebilir nodeları getirir.
         var tags=[];
         for(var infoNode in graph.nodes)
            if(d.id==graph.nodes[infoNode].id){
                tags.push(graph.nodes[infoNode]);
                for(var infoLinks in graph.links)
                    if(graph.nodes[infoNode]==graph.links[infoLinks].source)
                        tags.push(graph.links[infoLinks].target);
        }
        return tags;
    }

    function clear_focus(){ // Pasife çekilen nodeları aktif yap (Tümü)
        if (focus_node!==null){
            focus_node = null;
            if (highlight_trans<1){
                circle.style("opacity", 1);
                text.style("opacity", 1);
                rect.style("display","none");
                link.style("opacity", 1);
            }
        }
        if (highlight_node === null) exit_highlight();
        tags_queue=[];
        noneUniqTags=[];
        coloringNode();
        markingNode(tags_queue);
        createTagsView(tags_queue);
        highlighter(tags_queue);
    }

    function dropdownmenu_clear(){ // Fikirlerin bulunduğu bloğu temizleme
       //document.getElementById("dropdownmenu").innerHTML = '';

    }

    function create_dropdown(d){ // Fikirlerin bulunduğu bloğu temizleme
        fikir = document.getElementById("dropdownmenu");

        //Akordion başlığı
        btnIdea = document.createElement("button");
        btnIdea.className="accordion";
        btnIdea.style="background-color: #f2f2f2; color:#111; background-image:none;position:relative;";
        var btnTxtContent=document.createElement("div");
        btnTxtContent.style="width:80%;float:left;";
        var btnTxt = document.createTextNode(d.title);
        btnTxtContent.appendChild(btnTxt);


        var imgContent=document.createElement("div");
        imgContent.style="width:15%;height:50%;float:right; position:absolute; top:15%; right:4%;";


        var txtBtwennessContent=document.createElement("p");
        txtBtwennessContent.className="voteText";
        txtBtwennessContent.style="height:50%;float:right;";

        var txtBtwenness = document.createTextNode(d.betweenness);
        txtBtwennessContent.appendChild(txtBtwenness);

        btnIdea.appendChild(btnTxtContent);

        fikir.appendChild(btnIdea);

        //Akordiyon içeriği
        var divIdea = document.createElement("div");
        divIdea.className="panel";
        divIdea.style="text-align:justify;padding-left: 30px;padding-right:30px;padding-top:20px;padding-bottom:20px;display:block; height:auto; margin-bottom: 10px; margin-left: 10px; margin-right: 14px;background-color: white; border-radius: 0px 0px 10px 10px;font-family: 'fonts/Roboto-Bold'; font-size: 16px; font-weight: 300;  line-height: 24px;";
        var pIdea = document.createElement("p");
        var btnTxt = document.createTextNode(d.idea);
        pIdea.appendChild(btnTxt);
        divIdea.appendChild(pIdea);
        fikir.appendChild(divIdea);

        button_clickEvent();
    }

    function addPanelPadding(){
        var panel=document.getElementsByClassName("panel");
        if( panel[panel.length-1])
        panel[panel.length-1].style="text-align:justify;padding-left: 30px;padding-right:30px;padding-top:20px;padding-bottom:20px;text-indent: 15px;display:block; height:auto; margin-bottom: 10px; margin-left: 10px; margin-right: 14px;background-color: white; border-radius: 0px 0px 10px 10px;margin-bottom:100px;font-family: 'fonts/Roboto-Bold'; font-size: 16px; font-weight: 300;  line-height: 24px;";
    }

    function button_clickEvent(){
         var acc = document.getElementsByClassName("accordion");
        for (var m = 0; m < acc.length; m++) {
            acc[m].onclick = function(){
                /* Toggle between adding and removing the "active" class,
                to highlight the button that controls the panel */
                this.classList.toggle("active");

                /* Toggle between hiding and showing the active panel */
                var panel = this.nextElementSibling;
                if (panel.style.display === "block") {
                    panel.style.display = "none";
                    this.style="border-radius: 10px 10px 10px 10px; margin-bottom:10px;";
                }else {
                    panel.style.display = "block";
                    this.style="border-radius: 10px 10px 5px 5px; margin-bottom:0px;";
                }
            }
        }
    }

    // zoom işleminde tekrardan ekrana basma işlemi gerçekleşmektedir.
    zoom.on("zoom", function() {
        //clear_focus();
        var stroke = nominal_stroke;
        if (nominal_stroke*zoom.scale()>max_stroke) stroke = max_stroke/zoom.scale();
        link.style("stroke-width",stroke);
        circle.style("stroke-width",stroke);

        var base_radius = nominal_base_node_size;
        if (nominal_base_node_size*zoom.scale()>max_base_node_size) base_radius = max_base_node_size/zoom.scale();
        circle.attr("d", d3.svg.symbol()
            .size(function(d) { return Math.PI*Math.pow(size(d.size)*base_radius/nominal_base_node_size||base_radius,2); })
            .type(function(d) { return "circle" }))// return d.type;

        //circle.attr("r", function(d) { return (size(d.size)*base_radius/nominal_base_node_size||base_radius); })
        if (!text_center) text.attr("dx", function(d) { return (size(d.size)*base_radius/nominal_base_node_size||base_radius); });

        var text_size = nominal_text_size;
        if (nominal_text_size*zoom.scale()>max_text_size) text_size = max_text_size/zoom.scale();
        text.style("font-size",text_size + "px");
        g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    });

    svg.call(zoom);

    resize();
    //window.focus();
    d3.select(window).on("resize", resize);



    function resize() {
        var width = window.innerWidth, height = window.innerHeight;
        svg.attr("width", width).attr("height", height);
        force.size([(force.size()[0]+(width-w)/zoom.scale())*1.2,force.size()[1]+(height-h)/zoom.scale()]).resume();
        w = width;
        h = height;
    }

    $('input[type=checkbox]').change(function(){
           switch (this.id) {
                //dataya eklenen kategoriler işlevsellik bakımında bu alana eklenmesi gerekmektedir. (Manual)
                // görsellik bakımından index.html sayfasına eklenmesi gerekmektedir.
                case "category1": keyc = !keyc;  break;
                case "category2": keys = !keys; break;
                case "category3": keyt = !keyt; break;
                //case "R": keyr = !keyr; break;
                //case "X": keyx = !keyx; break;
                //case "D": keyd = !keyd; break;
                //case "L": keyl = !keyl; break;
                //case "M": keym = !keym; break;
                //case "H": keyh = !keyh; break;
                //case "1": key1 = !key1; break;
                //case "2": key2 = !key2; break;
                //case "3": key3 = !key3; break;
                //case "0": key0 = !key0; break;
          }
            link.style("display", function(d) {
                var flag  = vis_by_type(d.source.type)&&vis_by_type(d.target.type)&&vis_by_node_score(d.source.score)&&vis_by_node_score(d.target.score)&&vis_by_link_score(d.score);
                linkedByIndex[d.source.index + "," + d.target.index] = flag;
                return flag?"inline":"none";});
            node.style("display", function(d) {
                return (key0||hasConnections(d))&&vis_by_type(d.type)&&vis_by_node_score(d.score)?"inline":"none";});
            text.style("display", function(d) {
                return (key0||hasConnections(d))&&vis_by_type(d.type)&&vis_by_node_score(d.score)?"inline":"none";});

            if (highlight_node !== null)
            {
                if ((key0||hasConnections(highlight_node))&&vis_by_type(highlight_node.type)&&vis_by_node_score(highlight_node.score)) {
                    if (focus_node!==null) set_focus(focus_node);
                    set_highlight(highlight_node);
                }
                else {exit_highlight();}
            }
    });
});

function vis_by_type(type)
{
    switch (type) {
        case "kime": return keyc;
        case "neyle": return keys;
        case "nerede": return keyt;
        case "diamond": return keyr;
        case "cross": return keyx;
        case "triangle-down": return keyd;
        default: return true;
    }
}
function vis_by_node_score(score)
{
    if (isNumber(score))
    {
        if (score>=0.666) return keyh;
        else if (score>=0.333) return keym;
        else if (score>=0) return keyl;
    }
    return true;
}

function vis_by_link_score(score)
{
    if (isNumber(score))
    {
        if (score>=0.666) return key3;
        else if (score>=0.333) return key2;
        else if (score>=0) return key1;
    }
    return true;
}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function showIdeaButton(obj){
    var showIdea;
    if(document.getElementById("showIdea").innerHTML.length==0)
        showIdea = document.getElementById("showIdeaClose");
    else
        showIdea = document.getElementById("showIdea");

    var ideaPanel = document.getElementById("ideaPanel");
    if(ideaPanel.style.display=="none"){
        ideaPanel.style.display = "block";
        document.getElementById("showIdea").style.display="none";
        document.getElementsByClassName('winFilter')[0].style.top="6%";
    }else {
        ideaPanel.style.display = "none";
        document.getElementById("showIdea").style.display="block";
        document.getElementsByClassName('winFilter')[0].style.top="12%";
    }

}
