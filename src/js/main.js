/**
 * gradient helper class
 * @param {number} c1 color from
 * @param {number} c2 color to
 * @returns {gradient}
 */
function gradient(c1, c2) {
    function extractBytes(num, mask, shift) {
        var a = num & mask;
        return a >> shift;
    }
    function extractR(col) {
        return extractBytes(col, 0xff0000, 16);
    }
    function extractG(col) {
        return extractBytes(col, 0x00ff00, 8);
    }
    function extractB(col) {
        return extractBytes(col, 0x0000ff, 0);
    }
    var r1 = extractR(c1);
    var r2 = extractR(c2);
    var g1 = extractG(c1);
    var g2 = extractG(c2);
    var b1 = extractB(c1);
    var b2 = extractB(c2);
    var dR = r2 - r1;
    var dG = g2 - g1;
    var dB = b2 - b1;
    console.log(c1, c2, r1, r2, g1, g2, b1, b2, dR, dG, dB);
    this.getColor = function(v) {
        var r = Math.floor(r1 + v * dR);
        var g = Math.floor(g1 + v * dG);
        var b = Math.floor(b1 + v * dB);
        r = r << 16;
        g = g << 8;
        var color = r + g + b;
        return color.toString(16);
    }
    return this;
}
/**
 * calculate distance between points
 * @param P1 first point
 * @param P2 second point
 * @returns {number} distance
 */
function distPoints(P1, P2) {
    var dx = P1[0]-P2[0];
    var dy = P1[1]-P2[1];
    return Math.sqrt(dx*dx+dy*dy);
}

/**
 * calculate vector from p1 to p2
 * @param p1 point1 [x,y]
 * @param p2 point2 [x,y]
 * @returns {[xDir, yDir]}
 */
function getDir(p1, p2) {
    return [p2[0]-p1[0], p2[1]-p1[1]];
}

/**
 * multiply two vectors using the dot product
 * @param v1 vector1 [xDir, yDir]
 * @param v2 vector2 [xDir, yDir]
 * @returns {number} dot product
 */
function vecDot(v1, v2) {
    return v1[0]*v2[0] + v1[1]*v2[1];
}

/**
 * add two vectors
 * @param v1 vector1 [xDir, yDir]
 * @param v2 vector2 [xDir, yDir]
 * @returns {[xDir, yDir]}
 */
function vecAdd(v1, v2) {
    return [v1[0]+v2[0],v1[1]+v2[1]];
}

/**
 * subtract v2 from v1 (v1 - v2)
 * @param v1 vector1  [xDir, yDir]
 * @param v2 vector2  [xDir, yDir]
 * @returns {[xDir, yDir]}
 */
function vecSub(v1, v2) {
    return vecAdd(v1, vecMul(v2, -1));
}

/**
 * scalar multiply vector by c
 * @param v vector  [xDir, yDir]
 * @param c scalar
 * @returns {[xDir, yDir]}
 */
function vecMul(v, c) {
    return [v[0]*c,v[1]*c];
}

/**
 * scalar multiply vector by 1/c
 * @param v vector  [xDir, yDir]
 * @param c scalar
 * @returns {[xDir, yDir]}
 */
function vecDiv(v, c) {
    return vecMul(v, 1/c);
}

/**
 * calculate length of vector
 * @param v vector [xDir, yDir]
 * @returns {number} length
 */
function vecLen(v) {
    return Math.sqrt(v[0]*v[0]+v[1]*v[1]);
}

/**
 * normalize vector (multiply by 1/length)
 * @param v vector
 * @returns {[xDir, yDir]}
 */
function vecNorm(v) {
    var len = vecLen(v);
    if (len === 0) {
        return v.slice();
    }
    return vecDiv(v, len);
}


var movers, intV;

/**
 * main function
 */
function go() {
    var s = Snap('#container');
    var width = document.querySelector('#container').getBoundingClientRect().width;
    var height = document.querySelector('#container').getBoundingClientRect().height;

    /** random gradient colors **/
    var col1 = Math.floor(Math.random()*0xffffff);
    var col2 = Math.floor(Math.random()*0xffffff);
    var grad = new gradient(col1, col2);

    /** masses of big balls **/
    var gravOnVal = 12000;
    var gravOffVal = 2000;
    /** planet masses **/
    var gravOnValBottom = 350000;
    var gravOffValBottom = -20000;

    /** big balls **/
    var bigBall = new mover([width /8, 190], [0, 0], 70, gravOnVal, false);
    var bigBall2 = new mover([2*width/8, 190], [0, 0], 70, gravOnVal, false);
    var bigBall3 = new mover([3*width/8, 190], [0, 0], 70, gravOnVal, false);
    var bigBall4 = new mover([4*width/8, 190], [0, 0], 70, gravOnVal, false);
    var bigBall5 = new mover([5*width/8, 190], [0, 0], 70, gravOnVal, false);
    var bigBall6 = new mover([6*width/8, 190], [0, 0], 70, gravOnVal, false);
    var bigBall7 = new mover([7*width/8, 190], [0, 0], 70, gravOnVal, false);

    var topRight = new mover([width, 0], [0, 0], 70, gravOffVal, true);
    var topLeft = new mover([0, 0], [0, 0], 70, gravOffVal, true);

    /** planets **/
    var planetRad = width * 2;
    var planetX = width / 2;
    var planetY = height + Math.sqrt(planetRad * planetRad - (width/2) * (width/2));
    var planetMass = gravOnValBottom = 350000 * ((planetRad / 3400));
    var planet = new mover([planetX, planetY], [0, 0], planetRad, planetMass, true);
    var planet2 = new mover([planetX, planetY], [0, 0], planetRad * 1.01, 0, true);

    /** populate movers (actors) array **/
    movers = [planet, bigBall, bigBall2, bigBall3, bigBall4, bigBall5, bigBall6, bigBall7];
    for (var i = 0; i < 200; i++) {
        movers.push(spawnMover());
    }

    /** clear old interval if set **/
    if (intV) {
        clearInterval(intV);
    }

    function drawCircle(M, r, color) {
        if (color == undefined) {
            color = "#bada55";
        }
        var circle = s.circle(M[0], M[1], r);
        circle.attr({
            fill:color,
            strokeWidth: 1
        });
    }

    function drawMover(mover) {
        var len;
        /** color code by velocity
        len = vecLen(mover.dir);
        len /= 300;
        len = Math.min(1, len);
        len = 1-len; **/
        /** color code by y position
        len = mover.pos[1];
        len /= height; **/
        /** rainbow gradient
        var colStr = "hsb("+len+ ",0.0, "+len+")"; **/
        /** use custom gradient
        var colStr = "#"+grad.getColor(len); **/

        // color of planet
        if (mover.isStatic) {
            colStr="#"+grad.getColor(1);
        }
        colStr = "#000";  // make all movers black
        if (mover != planet2) {
            drawCircle(mover.pos, mover.radius, colStr);
        }
    }

    var idCount = 0;
    function mover(pos, dir, radius, mass, isStatic) {
        this.pos = pos;
        this.dir = dir;
        this.radius = radius;
        this.mass = mass;
        this.isStatic = isStatic;
        this.id = idCount++;
        this.lastColliders = [];
        this.move = function(time) {
            if (this.isStatic) {
                return;
            }
            this.dir = vecMul(this.dir, 0.99);
            this.pos = vecAdd(this.pos, vecMul(this.dir, time/1000));
        };
        this.moveTowards = function(mover, rate, time) {
            if (this.isStatic) {
                return;
            }
            var dir = getDir(this.pos, mover.pos);
            dir = vecNorm(dir);
            dir = vecMul(dir, rate * time / 1000);
            this.dir = vecAdd(this.dir, dir);
        };
        this.collide = function(mover) {
            var mass1 = Math.abs(this.mass);
            var mass2 = Math.abs(mover.mass);

            var dir = getDir(this.pos, mover.pos);
            var n = vecNorm(dir);

            var j = -(1.8) * vecDot(vecMul(vecSub(mover.dir, this.dir),1 / ((1 / mass1) + (1 / mass2))), n);

            if (j > 0) {
                this.dir = vecSub(this.dir, vecMul(n, j / mass1));
                mover.dir = vecAdd(mover.dir, vecMul(n, j / mass2));
            }
        };
        return this;
    }

    /**
     * spawn random mover
     * @returns {mover}
     */
    function spawnMover() {
        var x = Math.random() * width;
        var y = Math.random() * height*3/4;
        var radius = Math.random() * 10 + 5;
        var mass = Math.random() * 1000 + 500;
        return new mover([x,y], [Math.random()*20-10, Math.random()*20-10], radius, mass, false);
    }

    var gravOn = false;
    var gOn = 0;

    /**
     * randomly switch gravitation of big balls
     */
    function switchGrav(){
        if (Math.random()> 0.5) {
            bigBall.mass=gravOnVal*-2;
        } else {
            bigBall.mass=gravOffVal;
        }
        if (Math.random()> 0.5) {
            bigBall2.mass=gravOnVal*-2;
        } else {
            bigBall2.mass=gravOffVal;
        }
        if (Math.random()> 0.5) {
            bigBall3.mass=gravOnVal*-2;
        } else {
            bigBall3.mass=gravOffVal;
        }
        if (Math.random()> 0.5) {
            bigBall4.mass=gravOnVal*-2;
        } else {
            bigBall4.mass=gravOffVal;
        }
        if (Math.random()> 0.5) {
            bigBall5.mass=gravOnVal*-2;
        } else {
            bigBall5.mass=gravOffVal;
        }
        if (Math.random()> 0.5) {
            bigBall6.mass=gravOnVal*-2;
        } else {
            bigBall6.mass=gravOffVal;
        }
        if (Math.random()> 0.5) {
            bigBall7.mass=gravOnVal*-2;
        } else {
            bigBall7.mass=gravOffVal;
        }
        if (Math.random()> 0.5) {
            topLeft.mass=gravOnVal*-1;
        } else {
            topLeft.mass=gravOffVal;
        }
        if (Math.random()> 0.5) {
            topRight.mass=gravOnVal*-1;
        } else {
            topRight.mass=gravOffVal;
        }
        if (Math.random()> 1) {
            planet.mass=gravOffValBottom;
        } else {
            planet.mass=gravOnValBottom;
        }
    }

    document.body.addEventListener('click', function() {
        gravOn = !gravOn;
        gOn++;
        gOn %= 3;
        if (gOn == 0) {
            bigBall.mass=gravOnVal*-2;
            //bigBall2.mass=gravOnVal*-2;
            bigBall2.mass=gravOffVal;
            bigBall3.mass=gravOffVal;
        }
        if (gOn == 1) {
            bigBall.mass=gravOffVal;
            //bigBall2.mass=gravOnVal*-2;
            bigBall2.mass=gravOnVal*-2;
            bigBall3.mass=gravOffVal;
        }
        if (gOn == 2) {
            bigBall.mass=gravOffVal;
            //bigBall2.mass=gravOnVal*-2;
            bigBall2.mass=gravOffVal;
            bigBall3.mass=gravOnVal*-2;
        }
        if (!gravOn) {

            bigBall4.mass=gravOffVal;
            planet.mass=gravOnValBottom;
            planet2.mass=gravOnValBottom;
            topRight.mass = gravOnVal;
            topLeft.mass = gravOnVal;
        } else {
            var neg = Math.random()<0.5?1:-1;
            /*bigBall.mass=gravOnVal*-2;
             //bigBall2.mass=gravOffVal;
             bigBall2.mass=gravOnVal*-2;
             bigBall3.mass=gravOnVal*-2;
             bigBall4.mass=gravOnVal;*/
            planet.mass=gravOffValBottom;
            planet2.mass=gravOffValBottom;
            topLeft.mass = gravOffVal;
            topRight.mass = gravOffVal;
        }
    });

    /**
     * calculate attraction between two movers
     * @param mover1
     * @param mover2
     * @returns {number}
     */
    function doTheNewton(mover1, mover2) {
        var G = 0.007;
        var dist = distPoints(mover1.pos, mover2.pos);
        return G * (mover1.mass*mover2.mass) / (dist*dist);
    }

    function checkCollision(mover, movers) {
        var colls = [];
        for (var i = 0; i < movers.length; i++) {
            if (movers[i].id != mover.id) {
                var dist = distPoints(mover.pos, movers[i].pos);
                if (dist <= (mover.radius + movers[i].radius)) {
                    var dir = vecNorm(getDir(mover.pos, movers[i].pos));
                    var delta = mover.radius + movers[i].radius - dist;
                    if (!movers[i].isStatic) {
                        if (mover == planet) {
                            /** if a mover touches the planet (or moves inside it) push it away **/
                            movers[i].dir = vecAdd(movers[i].dir, vecMul(dir, delta/3));

                        } else {
                            /** make sure movers don't overlap by moving them out of each other **/
                            movers[i].pos = vecAdd(movers[i].pos, vecMul(dir, delta));
                        }
                    }
                    if (movers[i] != planet2 && mover != planet2) {
                        colls.push(movers[i]);
                    }
                }
            }
        }
        return colls;
    }

    /**
     * bounce off walls
     * @param mover
     */
    function collideWalls(mover) {
        if (mover.isStatic) {
            return;
        }
        if (mover.pos[0]-mover.radius < 0) {
            mover.dir[0] = Math.abs(mover.dir[0]);
            mover.pos[0] = mover.radius;
        }
        if (mover.pos[0]+mover.radius > width) {
            mover.dir[0] = -1 * Math.abs(mover.dir[0]);
            mover.pos[0] = width-mover.radius;
        }
        if (mover.pos[1]-mover.radius < 0) {
            mover.dir[1] = Math.abs(mover.dir[1]);
            mover.pos[1] = mover.radius;
        }
        if (mover.pos[1]+mover.radius > height) {
            mover.dir[1] = -1 * Math.abs(mover.dir[1]);
            mover.pos[1] = height-mover.radius;
        }
    }

    var timeSum = 0;
    var lastTime = 1*new Date();
    /** main loop **/
    intV = setInterval(function() {
        var thisTime = 1*new Date();
        var timePassed = thisTime - lastTime;
        s.clear();
        /** use custom gradient background
        var g = s.gradient("l(0,1, 0, 0.25)#"+grad.getColor(1)+"-#fff"); **/
        var g = s.gradient("l(0,1, 0, 0.25)#f8e823-#fff");
        s.rect(0,0,width, height).attr({fill:g});
        /** move **/
        for (var i = movers.length; i--;) {
            movers[i].move(timePassed);
        }
        /** draw **/
        for (var i = 0; i < movers.length; i++) {
            drawMover(movers[i]);
        }
        for (var i = 0; i < movers.length; i++) {
            /** collision detection **/
            collideWalls(movers[i]);
            var colls = checkCollision(movers[i], movers.slice(i+1), timePassed);
            colls.forEach(function(col) {
                movers[i].collide(col);
            });
            /** calculate gravity **/
            for (var t = i+1; t <movers.length; t++) {
                var f = doTheNewton(movers[i], movers[t]);
                //movers[i].moveTowards(movers[t], f * movers[t].mass / movers[i].mass, timePassed);
                movers[t].moveTowards(movers[i], f * movers[i].mass / movers[t].mass, timePassed);
            }
        }
        timeSum += timePassed;
        /** switch gravity every 10 seconds **/
        if (timeSum > 10000) {
            switchGrav();
            timeSum = 0;
        }
        lastTime = thisTime;
    },30);

    switchGrav();
}

go();

window.addEventListener('resize',function() {go();})
