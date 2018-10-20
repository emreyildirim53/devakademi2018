package devakademi2018_dataParsing;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

public class parsingData {

	 static List<String> words=new ArrayList<String>();
	 static List<Integer> frequency=new ArrayList<Integer>();
	 
	static JSONObject root = new JSONObject();
	
	static int wordFreqLimit=50;// en fazla geçen 50 kelime üzerinde yoðunlaþ (Top 50);
	public static void main(String[] args) {
	
		JSONParser parser = new JSONParser();
		ArrayList<String> outputJSON =new ArrayList<String>();
		
		try {
			
			 Object obj= parser.parse(new FileReader("data.json"));
			
			 JSONArray jsonArray = (JSONArray) obj;
		
			 JSONArray allData=new JSONArray();
			 
			 for(int i=0;i<jsonArray.size();i++) 
				 allData.add((JSONObject) jsonArray.get(i));			 
			  
			 
			 
			 
			 
			 createNodesProperty(allData);
			 
			 createIdeasProperty(allData);
			 
			 
			 
			 //show(getTopWords);
			 /* Bu aþamada elimizde TopX tane kelime mevcut. Reklamlarýn text içerikleride mevcut.
			 Bu kelimeler hangi reklamlarda -BÝRLÝKTE- geçiyor????? 
			 
			 */
			 
			 
			
			 createLinksProperty(allData);
		
			 outputJSON.add(root.toJSONString());
			 
			 createFile("graph.json", outputJSON); 
			 
			 
			 
		
			 
			 
			 
			 
			 
			 
			 
			 /*
			  * 
			  * Corpustaki reklamlar
			 
			 ArrayList<Long> adIDs=new ArrayList<Long>();
			 
			 JSONArray advertsArray=new JSONArray();
			 
			 for(int i=0;i<jsonArray.size();i++) {
				 JSONObject ads = (JSONObject) jsonArray.get(i);
				 if(!adIDs.contains(ads.get("ad_id"))) {
					 advertsArray.add(ads);
					 adIDs.add((Long) ads.get("ad_id"));
				 }
			 }
			 createNodesProperty(advertsArray);
			 */
			 
			
			 
			
		} catch (IOException | ParseException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

        

	}
	
     private static void createNodesProperty(JSONArray data) {
    
		 for(int i=0;i<data.size();i++){
			 JSONObject row=(JSONObject) data.get(i);
			 String text=row.get("ad_title")+" "+row.get("ad_description");
			 ArrayList<String> adWords = new ArrayList<>(Arrays.asList(text.split(" ")));
			 for(int j=0;j<adWords.size();j++) {
				 if(words.contains(adWords.get(j)))
					 frequency.set(words.indexOf(adWords.get(j)), frequency.get(words.indexOf(adWords.get(j)))+1);
				 else{
					 words.add(adWords.get(j));
					 frequency.add(0);
				 }
			 }
		 }
			
		 // iki listede de sýra kaybetmeksizin eþ zamanlý sýrala
		 bubbleSortTwoList(words, frequency);
		 
		 //Topp X kelimeye bak
		 
		 ArrayList<String> getTopWords=getFilteredWords(words, wordFreqLimit);
		 words=getTopWords;
		 
		 
		 // Hangi reklam içerisinde geçti bu kelimeler
		 ArrayList<String> adverID=new ArrayList<String>();
		 for(int i=0;i<words.size();i++){
			String textIDs="";
			for(int j=0;j<data.size();j++){
				JSONObject row=(JSONObject) data.get(j);
				String text=row.get("ad_title")+" "+row.get("ad_description");
				ArrayList<String> adWords = new ArrayList<>(Arrays.asList(text.split(" ")));
				
				if(adWords.contains(words.get(i)))
					textIDs+=j+",";
			}
			if(textIDs.substring(textIDs.length()-1, textIDs.length()).equals(","))
				textIDs=textIDs.substring(0, textIDs.length()-1);
			adverID.add(textIDs);
		 }
		 
		 int maxValue=Collections.max(frequency); // normalizasyon için max value
		 JSONArray children=new JSONArray();	
		 	for(int i=0;i<words.size();i++){
		 		 JSONObject child = new JSONObject();	
				 child.put("size",(((float)frequency.get(i)/(float)maxValue)*100));
				 child.put("id",words.get(i));
				 child.put("ideaID",i);
				 child.put("indexID",adverID.get(i).substring(20));
				 children.add(child);
		 	}
		 root.put("nodes", children);	
		 	 
      }	
	  
  	 private static void createIdeasProperty(JSONArray data) {	 
  		 
  		 JSONArray children=new JSONArray();		
  		 	for(int i=0;i<data.size();i++){
  		 		 JSONObject child = new JSONObject();
  		 		 JSONObject row=(JSONObject) data.get(i); 
  		 		 String text=row.get("ad_title")+" "+row.get("ad_description");
  		 		 ArrayList<String> adWords = new ArrayList<>(Arrays.asList(text.split(" ")));
  		 		 String ids="";
  		 		 for(int j=0;j<adWords.size();j++) ids+=adWords.get(j)+",";
  				 child.put("id",i);
  				 child.put("title",row.get("ad_title"));
  				 child.put("idea",text);
  				 child.put("words",ids);
  				 child.put("betweenness",0);
  				 children.add(child);
  		 	}
  		 root.put("ideas", children);		  
  	  }
  	
 
  	 
 	 private static void createLinksProperty(JSONArray data) {		
 	

	JSONObject linkObjects;
		
		Set<String> ideasFirst = null,ideasSecond=null;
		JSONObject wordFirst=null,wordSecond=null;
		
		int size=0;
		
		JSONArray nodes=(JSONArray) root.get("nodes");
		JSONArray links=new JSONArray();
		
		for (int i = 0; i < nodes.size(); i++) {
			int countWordLink=0;
			for (int j = i+1; j < nodes.size(); j++) {
				wordFirst = (JSONObject) nodes.get(i);
				wordSecond = (JSONObject) nodes.get(j);
				ideasFirst = new HashSet<String>(Arrays.asList(((String) wordFirst.get("indexID")).split(",")));
				ideasSecond = new HashSet<String>(Arrays.asList(((String) wordSecond.get("indexID")).split(",")));
			
				size=ideasFirst.size();
				ideasFirst.retainAll(ideasSecond);//Ortak geçen elemanlar
				
				if(ideasFirst.size()!=0) {
					countWordLink++;
					linkObjects = new JSONObject();
					linkObjects.put("source", i);
					linkObjects.put("target", j);
					linkObjects.put("weight", ideasFirst.size());
					links.add(linkObjects);
					
					linkObjects = new JSONObject();
					linkObjects.put("source", j);
					linkObjects.put("target", i);
					linkObjects.put("weight", ideasFirst.size());
					links.add(linkObjects);	
				}
			}
			//((JSONObject) nodes.get(i)).put("size",size);	
		}
 	 	root.put("links", links);		
 		 
 	}
	
 	 private static ArrayList<ArrayList<Integer>> testBaglantiKontrol(ArrayList<ArrayList<Integer>> targets) {
		
		for(int i=0;i<targets.size();i++){
			ArrayList<Integer> torba=targets.get(i);
			for(int j=0;j<torba.size();j++){
				if(!targets.get(torba.get(j)).contains(i)){
					targets.get(torba.get(j)).add(i);
				}
			}
		}
		return targets;
	}

      static void bubbleSortTwoList(List<String> uniqTFWords,List<Integer> uniqTFValue ) {  
	      int n = uniqTFValue.size();  
	      int temp = 0;
	      String temp2="";
	       for(int i=0; i < n; i++){  
	           for(int j=1; j < (n-i); j++){  
	                if(uniqTFValue.get(j-1) < uniqTFValue.get(j)){                                
	                       temp = uniqTFValue.get(j-1);
	                       temp2=uniqTFWords.get(j-1);
	                       uniqTFValue.set(j-1,uniqTFValue.get(j)); 
	                       uniqTFWords.set(j-1,uniqTFWords.get(j));  
	                       uniqTFValue.set(j,temp); 
	                       uniqTFWords.set(j,temp2); 
	               }                 
	           }  
	       }  
	 } 
 
	  static ArrayList<String> getFilteredWords(List<String> words,int limit) {
		  
		  ArrayList<String> topLimit=new ArrayList<String>();
		  
		  for(int i=0;i<limit;i++) 
			  topLimit.add(words.get(i));
		  
		  
		  return topLimit;
	  }
	
	  static void show(ArrayList list) {
		  for(int i=0;i<list.size();i++)
			  System.out.println(list.get(i));
	  }
	
	  public static void createFile(String URL,ArrayList<String> writeClass){
			FileOutputStream fileStream;
			try {
				fileStream = new FileOutputStream(new File(URL));
				OutputStreamWriter writer = new OutputStreamWriter(fileStream, "UTF-8");
				for(int i=0;i<writeClass.size();i++)
					writer.append(writeClass.get(i)+System.getProperty("line.separator"));
				writer.close();
				System.out.println("File write successful");
			} catch (FileNotFoundException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (UnsupportedEncodingException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			
		}
	  
}
