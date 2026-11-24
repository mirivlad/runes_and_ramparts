#include <stdint.h>
#include "pt3player.h"
#include "ayumi.h"
static uint8_t input[65540];
static float output[16384*2];
static struct ayumi chip;
static int rate,remaining,elapsed;
extern int rr_pt3_looped;
int rr_ended(void){return rr_pt3_looped;}
uint8_t *rr_input(void){return input;}
float *rr_output(void){return output;}
int rr_init(int length,int sr){
 if(length<203||length>65536||sr<22050||sr>192000||input[98]!=32)return 0;
 if(length>=4&&input[length-2]=='T'&&input[length-1]=='S')return 0;
 if(func_setup_music(input,length,0,0)!=1)return 0;
 if(!ayumi_configure(&chip,0,1773400,sr))return 0;
 for(int i=0;i<3;i++)ayumi_set_pan(&chip,i,i*.4+.1,0);
 rate=sr;remaining=0;elapsed=0;rr_pt3_looped=0;return 1;
}
int rr_render(int n){
 if(n<1||n>16384)return 0;
 for(int i=0;i<n;i++){
  if(rr_pt3_looped)return i;
  if(remaining<=0){uint8_t r[14];func_play_tick(0);if(rr_pt3_looped||++elapsed>50*60*30){rr_pt3_looped=1;return i;}func_getregs(r,0);
   for(int j=0;j<3;j++){ayumi_set_tone(&chip,j,((r[j*2+1]&15)<<8)|r[j*2]);ayumi_set_mixer(&chip,j,(r[7]>>j)&1,(r[7]>>(j+3))&1,(r[8+j]>>4)&1);ayumi_set_volume(&chip,j,r[8+j]&15);}
   ayumi_set_noise(&chip,r[6]&31);ayumi_set_envelope(&chip,(r[12]<<8)|r[11]);if(r[13]!=255)ayumi_set_envelope_shape(&chip,r[13]&15);remaining+=rate;
  }
  remaining-=50;ayumi_process(&chip);ayumi_remove_dc(&chip);output[i*2]=(float)(chip.left*.38);output[i*2+1]=(float)(chip.right*.38);
 }
 return n;
}
