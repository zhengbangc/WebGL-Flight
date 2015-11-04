//-------------------------------------------------------------------------
/* this is the function that generates the terrain by interation. It first generates the vertices with height zero.
    Then it changes the height of the vertices by the dimondSqaure algorithm. Finally it calculates the normal for 
    each face to be use in the bling-phong model of lighting*/
function terrainFromIteration(n, minX,maxX,minY,maxY, vertexArray, faceArray,normalArray)
{
    var deltaX=(maxX-minX)/n;
    var deltaY=(maxY-minY)/n;
    //the grid (n rows)x(n cols), but it is (n+1)x(n+1) vetices
    
    for(var x=0; x<=n; x++){
        for(var y=0; y<=n; y++){
            vertexArray.push(minX+deltaX*x); //x
            vertexArray.push(minY+deltaY*y);  //z
            vertexArray.push(0); //y



        }
    }
    
    
    //set the height of each vertex in the vertex array to the height from the corresponding space 
    //in the heightmap of a newly generated terrain tile
    var scale = 0.01;
    var terrain = new Terrain(n+1);
    terrain.build();
    for(var x=0; x<=n; x++){
        for(var y=0; y<=n; y++){
            height = terrain.vertexHeight(x,y);
            height_scaled = height * scale;
            vertexArray[(x*(n+1)+y)*3+2] = height_scaled; 
            //for each vertex, x value, y value, and height value are stored contiguously, so we need to times 3
            //and we access the first value in the current vertex, we'll need to add 2 to access the height value
        }
    }
    
    
    var numT=0;
    for(var row=0; row<n; row++){
        for(var col=0; col<n; col++){
           var vid = row*(n+1) + col;


           //face1
           faceArray.push(vid);
           faceArray.push(vid+1);
           faceArray.push(vid+n+1);

           //face 2
           faceArray.push(vid+1);
           faceArray.push(vid+1+n+1);
           faceArray.push(vid+n+1);
           numT+=2;
       } 
    }

for(var x=0; x<=n; x++){
    for(var y=0; y<=n; y++){

            // var face_normal = vec3.fromValues(0,0,1); 
            // vec3.normalize(face_normal, face_normal);
            // normalArray.push(face_normal[0]);
            // normalArray.push(face_normal[1]);
            // normalArray.push(face_normal[2]);

            //normal Array is the array containing the normal of each surface
            var edgeVector1 = vec3.create(); // one vector of each face
            var edgeVector2 = vec3.create(); //another vector of each face
            //1. we need to obtain the vector by calculating from the face's vertex
            var vertex1 = vec3.create();
            vertex1[0] = vertexArray[ (x*(n+1) + y)*3];          //x
            vertex1[1] = vertexArray[ (x*(n+1) + y)*3 + 1];      //z
            vertex1[2] = vertexArray[ (x*(n+1) + y)*3 + 2]      //y
            var vertex2 = vec3.create();
            vertex2[0] = vertexArray[( (x+1)*(n+1) + y)*3];          //x
            vertex2[1] = vertexArray[( (x+1)*(n+1) + y)*3 + 1];      //z
            vertex2[2] = vertexArray[( (x+1)*(n+1) + y)*3 + 2];      //y
            var vertex3 = vec3.create();
            vertex3[0] = vertexArray[ (x*(n+1) + y + 1)*3];          //x
            vertex3[1] = vertexArray[ (x*(n+1) + y + 1)*3 + 1];      //z
            vertex3[2] = vertexArray[ (x*(n+1) + y + 1)*3 + 2];      //y

            edgeVector1[0] = vertex1[0] - vertex2[0];  
            edgeVector1[1] = vertex1[1] - vertex2[1];  
            edgeVector1[2] = vertex1[2] - vertex2[2]; 
            edgeVector2[0] = vertex1[0] - vertex3[0];  
            edgeVector2[1] = vertex1[1] - vertex3[1];  
            edgeVector2[2] = vertex1[2] - vertex3[2]; 

            //2. then we need to calculate the cross product of edgeVector1 and edgeVector2
            var face_normal = vec3.create();   
            vec3.cross(face_normal, edgeVector1, edgeVector2);
            vec3.normalize(face_normal, face_normal);
            //3. put this cross product, the normal, into the normal array
            //we need to get the vector             
            // var normal = vec3.fromValues(0,0,1); 
            // vec3.normalize(normal, normal);
            // normalArray.push(normal[0]);
            // normalArray.push(normal[1]);
            // normalArray.push(normal[2]);
            normalArray.push(face_normal[0]);
            normalArray.push(face_normal[1]);
            normalArray.push(face_normal[2]);

        }
    }
       
    return numT;
}






//-------------------------------------------------------------------------
/* this is the function called to generate the lines connecting the vertices*/
function generateLinesFromIndexedTriangles(faceArray,lineArray)
{
    numTris=faceArray.length/3;
    for(var f=0;f<numTris;f++)
    {
        var fid=f*3;
        lineArray.push(faceArray[fid]);
        lineArray.push(faceArray[fid+1]);
        
        lineArray.push(faceArray[fid+1]);
        lineArray.push(faceArray[fid+2]);
        
        lineArray.push(faceArray[fid+2]);
        lineArray.push(faceArray[fid]);
    }
}

//-------------------------------------------------------------------------


