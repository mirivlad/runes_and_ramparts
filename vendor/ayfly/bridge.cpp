#include <stdint.h>
#include <stddef.h>
extern "C" {
#include "../pt3/ayumi.h"
void *memset(void *,int,size_t);
void *memcpy(void *,const void *,size_t);
int abs(int);
}
static size_t strlen(const char *s){size_t n=0;while(s[n])n++;return n;}
static int strncmp(const char *a,const char *b,size_t n){for(size_t i=0;i<n;i++){if(a[i]!=b[i])return (unsigned char)a[i]-(unsigned char)b[i];if(!a[i])break;}return 0;}
struct AYSongInfo {unsigned char *module; void *data; bool ended; uint8_t regs[14];};
enum {AY_CHNL_A_FINE,AY_CHNL_A_COARSE,AY_CHNL_B_FINE,AY_CHNL_B_COARSE,AY_CHNL_C_FINE,AY_CHNL_C_COARSE,AY_NOISE_PERIOD,AY_MIXER,AY_CHNL_A_VOL,AY_CHNL_B_VOL,AY_CHNL_C_VOL,AY_ENV_FINE,AY_ENV_COARSE,AY_ENV_SHAPE};
unsigned short ay_sys_getword(unsigned char *p){return p[0]|(p[1]<<8);}
void ay_sys_writeword(unsigned char *p,unsigned short v){p[0]=v;p[1]=v>>8;}
void ay_writeay(AYSongInfo *i,int r,unsigned char v){i->regs[r]=v;}
void ay_resetay(AYSongInfo *i,int){memset(i->regs,0,14);i->regs[13]=255;}
#include "tables.h"
#include "PT2Play.h"
#include "STPPlay.h"
static uint8_t input[131072],module[131072];
static float output[32768];
static AYSongInfo song;
static ayumi chip;
static int rate,remaining,format,elapsed;
extern "C" {
uint8_t* rr_input(){return input;}
float* rr_output(){return output;}
int rr_ended(){return song.ended;}
int rr_init(int len,int sr,int fmt){
 if(len<16||len>65536||sr<22050||sr>192000||(fmt!=2&&fmt!=4))return 0;
 memset(module,0,sizeof(module));memcpy(module,input,len);song={};song.module=module;
 if(fmt==2){
  if(len<133||!module[0])return 0;
  const int pat=ay_sys_getword(module+99);
  if(pat<132||pat+6>len||module[pat-1]!=255)return 0;
  int count=0;while(131+count<pat&&module[131+count]<128)count++;
  if(!count||count>255||module[2]>=count||131+count!=pat-1)return 0;
  for(int i=0;i<count;i++){int off=pat+module[131+i]*6;if(off+6>len)return 0;for(int j=0;j<3;j++){int ptr=ay_sys_getword(module+off+j*2);if(ptr<pat||ptr>=len)return 0;}}
  for(int i=0;i<48;i++){int ptr=ay_sys_getword(module+3+i*2);if(ptr&&ptr+2>len)return 0;}
  module[1]=count;PT2_Init(song);
 }
 else{if(!module[0]||!STP_Detect(module,len))return 0;STP_Init(song);}
 if(!ayumi_configure(&chip,0,1773400,sr))return 0;
 for(int i=0;i<3;i++)ayumi_set_pan(&chip,i,i*.4+.1,0);
 rate=sr;remaining=0;format=fmt;elapsed=0;return 1;
}
int rr_render(int n){
 if(n<1||n>16384)return 0;
 for(int i=0;i<n;i++){
  if(song.ended)return i;
  if(remaining<=0){song.regs[13]=255;if(format==2)PT2_Play(song);else STP_Play(song);if(song.ended||++elapsed>50*60*30){song.ended=true;return i;}
   uint8_t *r=song.regs;
   for(int j=0;j<3;j++){ayumi_set_tone(&chip,j,((r[j*2+1]&15)<<8)|r[j*2]);ayumi_set_mixer(&chip,j,(r[7]>>j)&1,(r[7]>>(j+3))&1,(r[8+j]>>4)&1);ayumi_set_volume(&chip,j,r[8+j]&15);}
   ayumi_set_noise(&chip,r[6]&31);ayumi_set_envelope(&chip,(r[12]<<8)|r[11]);if(r[13]!=255)ayumi_set_envelope_shape(&chip,r[13]&15);remaining+=rate;
  }
  remaining-=50;ayumi_process(&chip);ayumi_remove_dc(&chip);output[i*2]=(float)(chip.left*.38);output[i*2+1]=(float)(chip.right*.38);
 }
 return n;
}
}
