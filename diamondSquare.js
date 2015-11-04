
// this is the diamond square algorithm file which generate vertex height of the terrain
//reference: http://www.playfuljs.com/realistic-terrain-in-130-lines/


//this function is the constructor of the Terrain object,
//the object contains the height info of each vertex in the terrain
//n = gridN + 1: must be a power of 2 and it's specified in setupTerrainBuffers()
function Terrain(n) {
    this.size = n;
    this.max = this.size - 1; //the max index for x and y in the heightmap array
    this.heightmap = new Float32Array(this.size * this.size); //2D for x and y
    this.steep = 0.4; //how steep the hills are 
}

//overload the (x,y) operator to get the height from the heightmap
Terrain.prototype.vertexHeight = function(x, y) {
    if (x >= 0 && x <= this.max && y >= 0 && y <= this.max){
        return this.heightmap[x + this.size * y];
    } 
    return -1; //if the height doesnot exist, return -1
};

//overload the (x,y,val) operator to set the height from the heightmap
Terrain.prototype.setHeight = function(x, y, val) {
    this.heightmap[x + this.size * y] = val;
};

//-------------------------------------------------------------------------------------------
// Diamond Square algorithm starts from here

// this is the build function, called after we have create a Terrain Object
//builidng the terrain with steepness using the dimonad square algorithm from the course website
//1. initialize 4 corners of the map to be the same height
//2. for each square in the heightmap array, midpoint height = average of four corners + a random value
//3. for each dimond in the heightmap arry, midpoint height = average of four corners + a random value
//4. divide each square into 4 sub squres and repeat step 2 until all values in the heightmap array are set
Terrain.prototype.build = function() {
    var height_corner = 30; //my lucky number :D
    this.setHeight(0, 0, height_corner); //lower left
    this.setHeight(0, this.size-1, height_corner); //upper left
    this.setHeight(this.size-1, 0, height_corner); //lower right
    this.setHeight(this.size-1, this.size-1, height_corner); //upper right
    //after initialize the corners, now we can call the dimond square algorithm
    this.dimondSquare(this.max); 
};

//calling dimond square algorithm recursively on the current square's sub-squares
//base case is that there is no subsquare to be process anymore i.e. undividable
Terrain.prototype.dimondSquare = function(cur_size) {
    var x,y;
    var halfSize = cur_size/2; //the size of the sub square array as in size of x and size of y
    	if (halfSize < 1) return;// if there is no subquare to be processed, return
    
    var height_scale = this.steep * cur_size;
    //for each square
    //basicall there are only 4 such cases: lower left, lower right, upper left, upper right 
    for (y = halfSize; y < this.max; y += cur_size) {
        for (x = halfSize; x < this.max; x += cur_size) {
         this.square(x, y, halfSize, 19*(Math.random() * height_scale * 2 - height_scale));
        }
    }
    //for each diamond
    //basically tere are only 4 such cases: up, down, left, right
    for (y = 0; y <= this.max; y += halfSize) {
        for (x = (y + halfSize) % cur_size; x <= this.max; x += cur_size) {
            this.diamond(x, y, halfSize, 19*(Math.random() * height_scale * 2 - height_scale));
        }
    }
    
    
    //divide and iterate again
    this.dimondSquare(cur_size / 2);
};

//for each square in the heightmap array, midpoint height = average of four corners + a random value
Terrain.prototype.square = function(x, y, cur_size, random) {
    var corner_vertices = [];
    var temp;

    //
    if( this.vertexHeight(x - cur_size, y - cur_size) != -1){ 
        temp = this.vertexHeight(x - cur_size, y - cur_size);
        corner_vertices.push(temp);
    }
    //if the upper right corner exits
    if( this.vertexHeight(x + cur_size, y - cur_size) != -1){ 
        temp = this.vertexHeight(x + cur_size, y - cur_size);
        corner_vertices.push(temp);
    }
    //if the lower right corner exits
    if( this.vertexHeight(x - cur_size, y + cur_size) != -1){ 
        temp = this.vertexHeight(x - cur_size, y + cur_size);
        corner_vertices.push(temp);
    }
    //if the lower left corner exits
    if( this.vertexHeight(x + cur_size, y + cur_size) != -1){ 
        temp = this.vertexHeight(x + cur_size, y + cur_size);
        corner_vertices.push(temp);
    }
    
    var midpointAverage = this.midpointAverage(corner_vertices);
    this.setHeight(x, y, midpointAverage + random);
};

//For a diamond in the array, midpoint height = avg four corner points + random value
Terrain.prototype.diamond = function(x, y, cur_size, randomOffsetValue) {
    var diamondVertices = [];
    var temp;
    //if top corner exists
    if( this.vertexHeight(x, y - cur_size) !=-1){ 
        (temp = this.vertexHeight(x, y - cur_size));
        diamondVertices.push(temp);
    }
    //if bottom corner exists
    if( this.vertexHeight(x, y + cur_size) !=-1){ 
        temp = this.vertexHeight(x, y+cur_size);
        diamondVertices.push(temp);
    }
    //if right corner exists
    if( this.vertexHeight(x + cur_size, y) !=-1){ 
       temp = this.vertexHeight(x + cur_size, y);
       diamondVertices.push(temp);
    }
    //if left corner exists
    if( this.vertexHeight(x - cur_size, y) !=-1){ 
        temp = this.vertexHeight(x-cur_size, y);
        diamondVertices.push(temp);
    }

  var midpointAverage = this.midpointAverage(diamondVertices);
  this.setHeight(x, y, midpointAverage + randomOffsetValue);
};


//calculate the midpoint average of the square or the dimond
Terrain.prototype.midpointAverage = function(arrayOfValues) {
  var valid = arrayOfValues;
  var total = valid.reduce(function(sum, val) { return sum + val; }, 0);
  return total / valid.length;
}