---
title: "AMD-V Hypervisor Development - A Brief Explanation"
date:  "22-08-2022"
---

## Motativation
This was apart of my "Understanding of OS theoretical concepts" and emulator series. I enjoy my time with this project, if you're interested in AMD virtualization then read chapter 15 of the AMD manual. There was also a lack of complacent, with the amount of menial projects I've accomplished. I wanted to hit the bigger fish, something more precedence than my former projects, that was going to be considerable harder. I hope this was helpful for any others whom might decide to make an AMD Hypervisor.

[KrakenSvm Project](https://github.com/wizardengineer/krakensvm-mg)
## Table of Contents:
* [Preamble](#preamble)
   * [Purpose & Intentions](#purpose--intentions) 
   * [Support](#support)
   <!-- for #purpose talk about why you did this, the lack of resource they had for this.-->
* [Terminology](#terminology)
<!-- Add a introduction later on, once you start writing a blog-->

* [Overview - KrakenSvm Hypervisor](#overview---krakensvm-hypervisor)
   * [Virtual Machine Control Block (VMCB) - Parts](#virtual-machine-control-block-vmcb---parts)
	  * [Control Area](#control-area)
	  * [Save State Area](#save-state-area)
   * [Secure Virtual Machine (SVM) - Semantics](#secure-virtual-machine-svm---semantics)
   	  * [Checking Lock/Support Bits](#checking-locksupport-bits)
   	  * [Initializing VMCB](#initializing-vmcb)
   	  * [Setting EFER.SVME](#setting-efersvme)
   * [Secure Virtual Machine (SVM) - Instruction Set](#secure-virtual-machine-svm---instruction-set)
* [Credit - Special Thanks](#credit---special-thanks)
* [Reference - Resource I relied on](#reference---resource-i-relied-on)

<!-- 	Post code for each section
	Put visualization on how each Instruction in the Intstruction Set works
	put kernel driver concepts
	i.e. Dispatch and passive levels, IRQ levels,
	IOCTL
	
	explain what a guess mode is, explain what the 
	host is, explain how this HV is different from 
	mainstream HVs (VMWARE, VBOX), explain world switching,
	explain how injection works, explain the VM instructions
	better. Explain something that you may not have considered
	
	explain what a MSR-bitmap is,
	explain what VMEXIT is
-->

# Preamble
## Purpose & Intentions
There wasn't many, if any amd hypervisors, therefore I created a Proof Of Concept for educational purposes. There was a lack of resource to start someone off on the right foot. This project was to at least help subside any hardship that'll come from a lack resource to rely on. 

## Support
To test on VMWare make sure to turn off Hyper-v on main OS and enable Nested Virtualization on VMWare guest machine if you want to test KrakenSvm.

# Terminology
   * **Guest** - The guest is the virtual machine that will be running on the Hypervisor.
   * **Host** - When Host is used, it's referring the execution context of the Hypervisor. 
   * **World Switch** - is the act of switching between Host and Guest. The host will excute VMRUN to start-up or run the Guest. The sequence would usually be Host -> Guest -> Host 
   * **vCPUs or CPUs** - when the intel or amd manual discusses about a VMM having a CPUs. It's referring to it having CPU Cores, rather than a single entity CPU.
   * **Nest Page Table (NPT)** - "Nested paging eliminates the overhead caused by VM exits and page table accesses. In essence, with nested page tables the guest can handle paging without intervention from the hypervisor. Nested paging thus significantly improves virtualization performance." By [Oracle® VM VirtualBox](https://docs.oracle.com/en/virtualization/virtualbox/6.0/admin/nestedpaging.html)
   * **Intercepting** - In terms of Hypervisors, intercepting is the concept and process of having a consistent view of the virtual processor that is visible to the Guest OS. Any intercept that happens triggers a #VMEXIT on the Guest. 
   > Various instructions and events (such as exceptions) in the
guest can be intercepted by means of control bits in the VMCB.
The two primary classes of intercepts supported by SVM are
instruction and exception intercepts.
   * **Virtual Memory Control Block (VMCB)** - Hold information for the VMM and the Guest For intel this would be called VMCS
   * **Virtual Machine Monitor (VMM)** - "also known as a hypervisor, consists of software that controls the execution of multiple guest operating systems on a single physical machine." By [AMD Manual](https://www.amd.com/system/files/TechDocs/24593.pdf)

# Overview - KrakenSvm Hypervisor
A simple overview of the Hypervisor Kraken to describe the virtualization process on AMD-v.

## Virtual Machine Control Block (VMCB) - Parts
The VMCB is a data structure that holds crucial information and data, such as the CPU state and VMM (or Hypervisor) Information that'll correlate to how the Guest operates. Here's a simple VMCB Overview:


<p align="center">
    <img src="https://github.com/wizardengineer/krakensvm-mg/blob/main/img/VMCB-STRUCT%20(1).jpg">
</p>

The definition of a VMCB Structure:

*Linux Struct*
```c++
struct __attribute__ ((__packed__)) vmcb_fmt_t 
{
    control_area_64_t control_area;
    save_state_64_t   save_state;
};
```
*Windows Struct*
```cpp
struct vmcb_fmt_t 
{
    control_area_64_t control_area;
    save_state_64_t   save_state;
    uint8_t reserved[RESERVED_SIZE];
};
```
## Control Area
The Control Area is the data structure that holds and saves information for the Hypervisor. This data structure will determine the heuristic executions and rules for the Guest. For example, the initiation of intercepts will be held in the Intercept data members as bits, in the context of VMCB Initialization, before we even start virtualizing the CPUs. Along with other crucial information like the EXITCODE, that'll describe how and why a #VMEXIT was caused, after, or within the instant of virtualizing the CPUs.

*Control Area Structure Overview*
```cpp
  //
  // Table B-1. VMCB Layout, Control Area.
  //

  typedef
    struct _control_area_fmt_t
  {
    _control_area_fmt_t() = default;
    
    union
    {
      uint64_t intercept_read_cr0  : 16;      // +0x000
      uint64_t intercept_write_cr0 : 16;      // +0x002
      uint64_t intercept_read_dr0  : 16;      // +0x004
      uint64_t intercept_write_dr0 : 16;      // +0x006
    };
  
    uint32_t intercept_exceptions_vector;     // +0x008
    uint32_t intercept_misc_vector_3;         // +0x00c
    uint32_t intercept_misc_vector_4;         // +0x010
   
    uint32_t intercept_misc_vector_5 : 5;     // +0x014
    uint32_t reserved_sbz_1          : 27;
   

    uint8_t reserved[0x3b - 0x18];            // +0x018–0x03b

    uint16_t pause_filter_threshold;          // +0x03c
    uint16_t pause_filter_count;              // +0x03e

    //
    // Physical base address of IOPM (bits 11:0 are ignored.)
    // 
    
    uint64_t iopm_base_pa;                    // +0x040

    //
    // Physical base address of MSRPM (bits 11:0 are ignored.)
    //

    uint64_t msrpm_base_pa;                   // +0x048

    //
    // TSC_OFFSET To be added in RDTSC and RDTSCP
    //

    uint64_t tsc_offset;                      // +0x050

    uint64_t guest_asid     : 32;             // +0x058
    uint64_t tlb_control    : 8;
    uint64_t reserved_sbz_2 : 24;

    uint64_t virtual_misc_vector;             // +0x060
    uint64_t interrupt_misc_vector;           // +0x068
    uint64_t exitcode;                        // +0x070
    uint64_t exitinfo1;                       // +0x078
    uint64_t exitinfo2;                       // +0x080
    uint64_t exitintinfo;                     // +0x088

    uint64_t enable_misc_vector;              // +0x090
    uint64_t avic_apic_bar;                   // +0x098
    uint64_t guest_pa_ghcb;                   // +0x0a0
    uint64_t eventinj;                        // +0x0a8
    uint64_t nested_page_cr3;                 // +0x0b0
    uint64_t lbr_virtualization_enable;       // +0x0b8

    clean_field vmcb_clean_bits;              // +0x0c0
    

    uint64_t n_rip;                           // +0x0c8

    uint8_t numbers_bytes_fetched;            // +0x0d0
    uint8_t guest_intruction_bytes[15];

    uint64_t avic_apic_backing_page_pointer;  // +0x0e0
    uint64_t reserved_sbz_3;                  // +0x0e8
    uint64_t avic_logical_table_pointer;      // +0x0f0
    uint64_t avic_physical_table_pointer;     // +0x0f8
    uint64_t reserved_sbz_4;                  // +0x100
    uint64_t vmsa_pointer;                    // +0x108
    uint8_t reserved_sbz_5[0x400 - 0x110];

  } control_area_64_t, *pcontrol_area_64_t;
```
## Save State Area
The Save State Area would usually be the second data structure in the VMCB struct. Save State Area holds a subset of our processor state/information for the Guest, that's either being loaded from the VMCB or saved to the VMCB. These acts are derived from [VMLOAD](#secure-virtual-machine-svm---instruction-set) and [VMSAVE](#secure-virtual-machine-svm---instruction-set) respectively.

*Save State Area*
```cpp
  //
  // Table B-2. VMCB Layout, State Save Area
  //

  typedef
    struct _save_state_fmt_t
  {
    _save_state_fmt_t() = default;

    seg_register es;                          // +0x000
    seg_register cs;                          // +0x010
    seg_register ss;                          // +0x020
    seg_register ds;                          // +0x030
    seg_register fs;                          // +0x040
    seg_register gs;                          // +0x050
    seg_register gdtr;                        // +0x060
    seg_register ldtr;                        // +0x070
    seg_register idtr;                        // +0x080
    seg_register tr;                          // +0x090

    uint8_t reserved1[0xca - 0xa0];           // +0x0a0
    uint8_t cpl;                              // +0x0cb
    uint32_t reserved2;                       // +0x0cc
    uint64_t efer;                            // +0x0d0
    uint8_t reserved3[0x147 - 0xd8];          // +0x0d9
    uint64_t cr4;                             // +0x148
    uint64_t cr3;                             // +0x150
    uint64_t cr0;                             // +0x158
    uint64_t dr7;                             // +0x160
    uint64_t dr6;                             // +0x168
    uint64_t rflags;                          // +0x170
    uint64_t rip;                             // +0x178
    uint8_t reserved4[0x1d7 - 0x180];         // +0x180
    uint64_t rsp;                             // +0x1d8
    uint64_t s_cet;                           // +0x1e0
    uint64_t ssp;                             // +0x1e8
    uint64_t isst_addr;                       // +0x1f0
    uint64_t rax;                             // +0x1f8
    uint64_t star;                            // +0x200
    uint64_t lstar;                           // +0x208
    uint64_t cstar;                           // +0x210
    uint64_t sfmask;                          // +0x218
    uint64_t kernel_gs_base;                  // +0x220
    uint64_t sysenter_cs;                     // +0x228
    uint64_t sysenter_esp;                    // +0x230
    uint64_t sysenter_eip;                    // +0x238
    uint64_t cr2;                             // +0x240
    uint8_t reserved5[0x267 - 0x248];         // +0x248
    uint64_t g_pat;                           // +0x268
    uint64_t dbg_ctrl;                        // +0x270
    uint64_t br_from;                         // +0x278
    uint64_t br_to;                           // +0x280
    uint64_t last_excp_from;                  // +0x288
    uint8_t reserved6[0x2df - 0x298];         // +0x298
    uint64_t spec_ctrl;                       // +0x2e0
    uint32_t reserved7;                       // +0x2e4

  } save_state_64_t, *psave_state_64_t;
```
# Secure Virtual Machine (SVM) - Semantics
This isn't the full semantics of an AMD Hypervisor that you'd see in the manual. This will be a brief and small explanation of creating a VMM for AMD CPUs and how I went about making mine. For the sake of not prolonging this article, I omitted some things, such as in-detail memory allocation, MSR Bitmap setup, and other things that can be easily researched.

## Checking Lock/Support Bits
These bits which are either accessed through an MSR or CPUID determine if the CPU is properly set for virtualization to be supported and doesn't have anything that'll lock or render us incapable of enabling virtualization. Let's look at pseudo-code to understand the algorithm for checking each lock and support bits:
<br>

```c
Fn8000_0001_ECX_SVM = (1UL << 2);
Fn8000_000A_EDX_NP  = (1UL << 0);
Fn8000_000A_EDX_SVML= (1UL << 2);
MSR_VM_CR           = 0xC0010114;


int32_t registers[4]; // Index 0 = EAX, 
                      // Index 1 = EBX, 
		      // Index 2 = ECX, 
		      // Index 3 = EDX

// checks to see if the processor supports SVM.
// See "SVM: secure virtual machine" in 
// "CPUID Fn8000_0001_ECX[WDT, SKINIT, OSVW, 3DNowPrefetch, MisAlignSse, SSE4A, ABM, ExtApicSpace]"
//
__cpuid(registers, Fn8000_0001_ECX);
if ( (registers[2] & Fn8000_0001_ECX_SVM) == 0 )
	return SVM_IS_NOT_SUPPORTED_BY_CPU;

// checks to see if the processor supports Nested Paging
// See "NP: nested paging" in "CPUID Fn8000_000A_EDX[DecodeAssists, FlushByAsid, VmcbClean, TscRateMsr]"
//
__cpuid(registers, Fn8000_000A_EDX);
if ( (registers[3] & Fn8000_000A_EDX_NP) == 0)
	return SVM_NESTED_PAGING_NOT_SUPPORTED;
	
// checks to see if the EFER.SVM can be enabled, if the VM_CR.SVMDIS is set then we can't enable EFER.SVM.
if (__readmsr(vm_cr) & vm_cr_svmdis) == 0
	return SVM_IS_CAPABLE_OF_BEING_ENABLE;

// checks if the user must change a platform firmware setting to enable SVM, if not SVMLock may be unlockable; 
// consult platform firmware or TPM to obtain the key
// See "SVML: SVM lock" in "CPUID Fn8000_000A_EDX[DecodeAssists, FlushByAsid, VmcbClean, TscRateMsr]"
__cpuid(registers, Fn8000_000A_EDX);
if ( (registers[3] & Fn8000_000A_EDX_SVML) == 0)
	return SVM_DISABLED_AT_BIOS_NOT_UNLOCKABLE;
else
	return SVM_DISABLED_WITH_KEY;
```

We check those bits to determine if our code can continue execution. These bits may not have to check if you are positive that your AMD Processor is up to date and is cable of virtualization; however, I would still recommend checking those bits, for the sake of practicality.
<br>

## Initializing VMCB
Initializing VMCB is monumental in allowing the Guest and VMM to run properly. The reason we initialize VMCB is to have consistency between the processor state and the guest state. This initialization is the preparation that'll be used for our VMM and Guest execution. This section will be showing the steps of initializing the VMCB. We'll start off by capturing the GDT & IDT registers, initializing the Guest Intercept fields of the `vcpu_data->guest_vmcb.control_area` and setting the guest's address space ID (ASID) to 1.

For the following code examples, they'll be stored in `vmcb_initialization(...)` function.

Lets first demonstrate the code Control Area initialization:
### — Control Area - Interception Fields & ASID
```cpp
#define INTERCEPT_MSR_PROT (1UL << 28) // MSR_PROT—intercept RDMSR or WRMSR accesses to selected MSRs.
#define INTERCEPT_CPUID    (1UL << 18) // Intercept CPUID Instruction.

#define INTERCEPT_VMRUN    (1UL << 0)  // Intercept VMRUN instruction.
#define INTERCEPT_VMMCALL  (1UL << 1)  // Intercept VMMCALL instruction.

// This will be explained later on...
//
_sgdt(&gdtr_ptr);
__sidt(&idtr_ptr);

vcpu_data->guest_vmcb
      .control_area.intercept_misc_vector_3 |= INTERCEPT_MSR_PROT | 
                                               INTERCEPT_CPUID;
vcpu_data->guest_vmcb
      .control_area.intercept_misc_vector_4 |= INTERCEPT_VMRUN;

vcpu_data->guest_vmcb.control_area.guest_asid = 1;
```
As you can see, the 32-bit data members `intercept_misc_vector_3` and `intercept_misc_vector_4` of Control Area does an OR set certain bits. The data member `intercept_misc_vector_3` will intercept the `INTERCEPT_MSR_PROT`and `INTERCEPT_CPUID`. The first Interception will be used to help determine which MSR will is being rdmsr and wrmsr. This is great because we can filter out which MSR we want to intercept specifically in our MSR Bitmap (that was allocated by the VMM) instead of intercepting every time an MSR rdmsr or wrmsr happens. The second bit that being set is the is `INTERCEPT_CPUID`, we'll use this interception to help with exiting our Guest and VMM and over the execution in a proper manner. That includes deallocation and giving our host back execution.

Now let's move on to the `intercept_misc_vector_4` data member. This data member sets the `INTERCEPT_VMRUN` which is required to be set, otherwise, our Guest won't execute at all. The instruction VMRUN does a Canonicalization and Consistency Checks for guests and #VMEXIT for the host. `INTERCEPT_VMRUN` not being set is considered to be an illegal guest state combination, subsequently causing a #VMEXIT with error code VMEXIT_INVALID.

The same concept applies to the `guest_asid`, a consistency check is done to make sure ASID is not set to 0. Otherwise, it'd be considered illegal, causing a #VMEXIT with the error code VMEXIT_INVALID.

You can find the first two data members correspondence in ***Table B-1. VMCB Layout, Control Area*** offset ***00Ch (vector 3)*** and ***Table B-1. VMCB Layout, Control Area (continued)*** offset ***010h (vector 4)***, respectively.

The last part of setting up the Control Area will be to initialize the Msr Permissions Map physical address.
```cpp
msrpm_vmcb_pa = MmGetPhysicalAddress(shared_page_info->msrpm_addr).QuadPart;
vcpu_data->guest_vmcb.control_area.msrpm_base_pa = msrpm_vmcb_pa;
```

### — Save State - Registers / Descriptor Table Registers / Segment Registers
Now that we've set up the Control Area for our VMCB, we'll start setting up the Save State by initialization the Control Registers, MSRs, and general-purpose registers.

```cpp
vcpu_data->guest_vmcb.save_state.cr0 = uint64_t(__readcr0());
vcpu_data->guest_vmcb.save_state.cr2 = uint64_t(__readcr2());
vcpu_data->guest_vmcb.save_state.cr3 = uint64_t(__readcr3());
vcpu_data->guest_vmcb.save_state.cr4 = uint64_t(__readcr4());
vcpu_data->guest_vmcb.save_state.efer = uint64_t(__readmsr(ia32_efer));

// GP Register (where they're suppose to be initialize)
vcpu_data->guest_vmcb.save_state.rsp = host_info.rsp;
vcpu_data->guest_vmcb.save_state.rip = host_info.rip;
vcpu_data->guest_vmcb.save_state.rflags = host_info.eflag;

// https://en.wikipedia.org/wiki/Page_attribute_table
vcpu_data->guest_vmcb.save_state.g_pat = __readmsr(ia32_pat)
```
As you can see, there's a struct that's being passed to the "GP Register" section called `host_info`. This was initialize before calling the `vmcb_initialization(...)` function.

After initialization Control Registers, MSRs, and general purpose registers, we'll start working on the Descriptor Table Registers and Segment Registers.
```cpp
vcpu_data->guest_vmcb.save_state.gdtr.base_addr = gdtr_ptr.base;
vcpu_data->guest_vmcb.save_state.gdtr.limit = gdtr_ptr.limit;

vcpu_data->guest_vmcb.save_state.idtr.base_addr = idtr_ptr.base;
vcpu_data->guest_vmcb.save_state.idtr.limit = idtr_ptr.limit;
 ```
 We're storing the base and limit of GDT & IDT registers, into the proper data members of the Save State.
 
```cpp
vcpu_data->guest_vmcb.save_state.es.limit = __segmentlimit(__reades());
vcpu_data->guest_vmcb.save_state.cs.limit = __segmentlimit(__readcs());
vcpu_data->guest_vmcb.save_state.ss.limit = __segmentlimit(__readss());
vcpu_data->guest_vmcb.save_state.ds.limit = __segmentlimit(__readds());
vcpu_data->guest_vmcb.save_state.fs.limit = __segmentlimit(__readfs());
vcpu_data->guest_vmcb.save_state.gs.limit = __segmentlimit(__readgs());

vcpu_data->guest_vmcb.save_state.es.selector = __reades();
vcpu_data->guest_vmcb.save_state.cs.selector = __readcs();
vcpu_data->guest_vmcb.save_state.ss.selector = __readss();
vcpu_data->guest_vmcb.save_state.ds.selector = __readds();
vcpu_data->guest_vmcb.save_state.fs.selector = __readfs();
vcpu_data->guest_vmcb.save_state.gs.selector = __readgs();
```
Setting up each segment registers limit and selector for the guest to use.

```cpp
const auto [es_base, es_attr] = seg::segment_info(gdtr_ptr, __reades());
vcpu_data->guest_vmcb.save_state.es.base_addr = es_base;
vcpu_data->guest_vmcb.save_state.es.attribute.value = es_attr;

const auto [cs_base, cs_attr] = seg::segment_info(gdtr_ptr, __readcs());
vcpu_data->guest_vmcb.save_state.cs.base_addr = cs_base;
vcpu_data->guest_vmcb.save_state.cs.attribute.value = cs_attr;

const auto [ss_base, ss_attr] = seg::segment_info(gdtr_ptr, __readss());
vcpu_data->guest_vmcb.save_state.ss.base_addr = ss_base;
vcpu_data->guest_vmcb.save_state.ss.attribute.value = ss_attr;

const auto [ds_base, ds_attr] = seg::segment_info(gdtr_ptr, __readds());
vcpu_data->guest_vmcb.save_state.ds.base_addr = ds_base;
vcpu_data->guest_vmcb.save_state.ds.attribute.value = ds_attr;

const auto [fs_base, fs_attr] = seg::segment_info(gdtr_ptr, __readfs());
vcpu_data->guest_vmcb.save_state.fs.base_addr = fs_base;
vcpu_data->guest_vmcb.save_state.fs.attribute.value = fs_attr;

const auto [gs_base, gs_attr] = seg::segment_info(gdtr_ptr, __readgs());
vcpu_data->guest_vmcb.save_state.gs.base_addr = gs_base;
vcpu_data->guest_vmcb.save_state.gs.attribute.value = gs_attr;

```
This will be the last part of setting up the segment and descriptor registers.

We'll start setting up physical addresses for later use. These data members will be passed through our #VMEXIT handler.
for the `host_vmcb_pa` load some host state that are not loaded on #VMEXIT, which you can see in [here](https://github.com/wizardengineer/krakensvm-mg/blob/2980e86d3885a7083e53ee9b445f40713783e1b5/krakensvm/svm/vmexit_handler.cpp#L281)
```cpp
host_vmcb_pa  = MmGetPhysicalAddress(&vcpu_data->host_vmcb).QuadPart;
guest_vmcb_pa = MmGetPhysicalAddress(&vcpu_data->guest_vmcb).QuadPart;

vcpu_data->guest_vmcb_pa = guest_vmcb_pa;
vcpu_data->host_vmcb_pa  = host_vmcb_pa;
 ```
 you can read in my [vmexecute.asm](https://github.com/wizardengineer/krakensvm-mg/blob/f16cb6d2676490be1e1025da976da1d4d99fe62c/krakensvm/svm/vmexecute.asm#L76-L97) why the `guest_vmcb_pa` was needed to be pass through in `vcpu_data` data structure, to give you an idea on how you'd approach doing utilizing `guest_vmcb_pa`.
 
 
 ```cpu
     __svm_vmsave(guest_vmcb_pa);
    __writemsr(vm_hsave_pa, MmGetPhysicalAddress(&vcpu_data->host_state_area).QuadPart);
    __svm_vmsave(host_vmcb_pa);
 ```
 Now, we'll do a vmsave to restore a subset of cpu information to the processor right before #VMEXIT with the VMLOAD instruction so that the guest can start its execution with saved state. The we write to VM_HSAVE_PA, to assure that the host can resume operation after #VMEXIT. VMRUN saves a subset of host processor state to the host state-save area specified by the physical address in the VM_HSAVE_PA MSR.
 
Last we'll save some of the current state to VMCB for the host usage. Keep in mind this is loaded after #VMEXIT to reproduce the current state for the host (VMM).
## Setting EFER.SVME

This is fairly simple, all we'll need to do is set the 13 bit of EFER (if we're counting starting from 1) which is EFER.SVME. In other words (1UL << 12).
```cpp
__writemsr(ia32_efer, __readmsr(ia32_efer) | ia32_efer_svme);
```

## Secure Virtual Machine (SVM) - Instruction Set

SVM has introduces the following instructions.

| Amd Mnemonic | Description                                                                                                      |
|--------------|------------------------------------------------------------------------------------------------------------------|
| VMRUN        | Performs a world-switch to guest                                                                                 |
| VMLOAD       | Load additional state from VMCB.                                                                                 |
| VMSAVE       | Save additional guest state to VMCB.                                                                             |
| CLGI         | Clears the global interupt flag (GIF).                                                                           |
| VMMCALL      | Provides a mechanism for a guest to explicitly  communicate with the VMM                                         |
| INVLPGA      | Invalidates the TLB mapping for the  virtual page specified in rAX and the ASID specified in ECX.                |
| SKINIT       | Designed to allows for verifiable startup of  trusted software (such as a VMM), based on  secure hash comparison |
| STGI         | The STGI instruction sets the global interrupt  flag (GIF) to 1.                                                 |

### VMSAVE Visual Representation
![VMSAVE](https://raw.githubusercontent.com/wizardengineer/krakensvm-mg/main/img/vmsave.drawio.png)
### VMRUN Visual Representation
![VMRUN](https://raw.githubusercontent.com/wizardengineer/krakensvm-mg/main/img/IntroducingBluePill.ppt.pdf.png)

[KrakenSvm Project](https://github.com/wizardengineer/krakensvm-mg)

## Credit - Special Thanks:
  Thanks to these OGs, for the spark of inspiration/support and just being good friends/acquaintances overall on my continuous effort on this project and for helping me understand certain concepts within HyperVisor development Journey. =)
  * [xeroxz](https://twitter.com/_xeroxz?lang=en) - Helping explain concepts around HV and allowing me to post my article on his website
  * [Daax](https://twitter.com/daax_rynd) - His big brain coming in clutch like always. He's given me a great layout on the semantics of a AMD HyperVisor and his approach on it, sharing resources left and right. Even answered my most trivial questions. Daax never misses
  * **horsie** - sharing some resource
  * [tandasat](https://github.com/tandasat/SimpleSvm/) - Amazing resource
  * [Irql0](https://github.com/irql0) - explaining certain Windows kernel driver, OS concepts and getting me out of tough assembly problems
  * [iPower](https://github.com/iPower) - sharing an approach to hooking System Calls and helping fix my VMCB issues
  * [Matthias](https://github.com/not-matthias) - For providing information that lead me on to fixing a VMEXIT_INVALID bug i came across and for going out of his way to even debug my HyperVisor to point logic issues and errors. Thank you so much 
  * [Snowua](#https://github.com/LilPidgey) for helping proof read this article.
   
 ## Reference - Resource I relied on:
   * [AMD CPUID Specification](http://developer.amd.com/wordpress/media/2012/10/254811.pdf)
   * [AMD Manual](https://www.amd.com/system/files/TechDocs/24593.pdf) 
   * [AMD Pacifica Docs](http://www-archive.xenproject.org/files/Xen_PacificaDisclosure_AMD_EWahlig.pdf)
   * [Intel Manual](https://software.intel.com/content/www/us/en/develop/articles/intel-sdm.html)
   * [Xeroxz Hypervisor](https://githacks.org/_xeroxz/bluepill)
   * [Irql Hypervisor](https://github.com/irql0/limevisor)
   * [VMM Intercepts](https://performancebydesign.blogspot.com/2017/12/hyper-v-architecture-intercepts.html)
   * [Kernel Play Guide - AMD-V](https://nskernel.gitbook.io/kernel-play-guide/kvm/amd-v-and-sev)
   * [System calls on Windows x64](https://www.n4r1b.com/posts/2019/03/system-calls-on-windows-x64/)
   * [[windows] kernel internals](https://www.matteomalvica.com/minutes/windows_kernel/)
 <!-- 
 for any unknown understandings
  - windows stack ABI = https://www.gamasutra.com/view/news/178446/Indepth_Windows_x64_ABI_Stack_frames.php
  -->
