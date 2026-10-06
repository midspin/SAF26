import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const csvRaw = `SAF Code,Inventory Category,Sub Category,Element,Brand,Model,Size/LWH,Serial No,Allocated,Allocated,Remaining,Total Qty,Allocated To,Location,Zone,Condition,Throw Ratio,Remarks
Na,Furniture,Stool,White Stool,Na,Na,12X18,Na,0,,19,19,,Delhi Warehouse,To be defined,Ok,,Ok
Na,Furniture,Stool,Blue Iron Stool,Na,Na,12X18,Na,0,,5,5,,Delhi Warehouse,To be defined,Ok,,Ok
Na,Furniture,Stool,Black Iron Stool,Na,Na,12X18,Na,0,,4,4,,Delhi Warehouse,To be defined,Ok,,Ok
Na,Furniture,Storage,Shelf,Na,Na,51X35X16,Na,0,,3,3,,Delhi Warehouse,To be defined,Ok,,Ok
Na,Furniture,Bench,Mango Wood Bench,Na,Na,18X51X18,Na,0,,6,6,,Delhi Warehouse,To be defined,Ok,,Ok
Na,Furniture,Bench,Neo Bench - Black Stained Ashwood,Na,Na,18X47X12,Na,0,,4,4,,Delhi Warehouse,To be defined,Ok,,Ok
Na,Furniture,Bench,Bench 2023 PWD,Na,Na,16X47X12,Na,0,,7,7,,Delhi Warehouse,To be defined,Ok,,Ok
Na,Production,Display,High Raise Light Box,Na,Na,50X15X13,Na,0,,5,5,,Delhi Warehouse,To be defined,Ok,,Ok
Na,Furniture,Side table,Iron Round Side Table,Na,Na,17X17X21,Na,0,,4,4,,Delhi Warehouse,To be defined,Ok,,Ok
Na,Furniture,Table,Iron Glass Top Table,Na,Na,20X20X20,Na,0,,1,1,,Delhi Warehouse,To be defined,Ok,,Ok
Na,Furniture,Stool,Sono Stool - Natural Oakwood,Na,Na,18X11X11,Na,0,,2,2,,Delhi Warehouse,To be defined,Ok,,Ok
Na,Furniture,Table,Iron Glass Top Table 2,Na,Na,18X36X18,Na,0,,1,1,,Delhi Warehouse,To be defined,Ok,,Ok
Na,Furniture,Chair,Pouf,Na,Na,14X12X12,Na,0,,4,4,,Delhi Warehouse,To be defined,Ok,,Ok
Na,Furniture,Bench,Wooden Bench,Na,Na,19X47X14,Na,0,,4,4,,Delhi Warehouse,To be defined,Ok,,Ok
Na,Furniture,Storage,Cabinet,Na,Na,65X18X8,Na,0,,4,4,,Delhi Warehouse,To be defined,Ok,,Ok
Na,Furniture,Storage,Glass Cabinet,Na,Na,59X38X15,Na,0,,1,1,,Delhi Warehouse,To be defined,Ok,,Ok
Na,Furniture,Storage,Glass Cabinet 2,Na,Na,59X22X22,Na,0,,1,1,,Delhi Warehouse,To be defined,Ok,,Ok
Na,Furniture,Table,White Table 1,Na,Na,29X47X24,Na,0,,6,6,,Delhi Warehouse,To be defined,Ok,,Ok
Na,Furniture,Table,White Table 2,Na,Na,30X62X24,Na,0,,1,1,,Delhi Warehouse,To be defined,Ok,,Ok
Na,Furniture,Table,White Table 3,Na,Na,30X54X30,Na,0,,7,7,,Delhi Warehouse,To be defined,Ok,,Ok
Na,Furniture,Table,White Table 3,Na,Na,29X79X30,Na,0,,1,1,,Delhi Warehouse,To be defined,Ok,,Ok
Na,Furniture,Storage,White Drawer,Na,Na,24X17X21,Na,0,,13,13,,Delhi Warehouse,To be defined,Ok,,Ok
Crompton,Appliance,Fan,White Pedestal Fan,Crompton,Na,Na,Na,0,,1,1,,Defence Colony,To be defined,Ok,,Ok
Na,Misc.,Board,Memo Board Black,IKEA,Na,40x60,Na,0,,4,4,,Defence Colony,To be defined,Ok,,2 ground floor + 2 first floor hall
Na,Misc.,Storage,Shelving Unit,IKEA,Na,60x27x140,Na,0,,2,2,,Defence Colony,To be defined,Ok,,Kitchen
Na,Misc.,Storage,Box With Castors And Lid White,IKEA,Na,38x51x37,Na,0,,5,5,,Defence Colony,To be defined,Ok,,Storage
Na,Misc.,Board,Whiteboard Noticeboard With Castors,IKEA,Na,70x180,Na,0,,3,3,,Defence Colony,To be defined,Ok,,1 Ground floor + 2 First Floor
Na,Misc.,Storage,Box With Lid Transparent,IKEA,Na,57x39x28 cm/45,Na,0,,9,9,,Defence Colony,To be defined,Ok,,Storage
Na,Misc.,Storage,Box With Lid White,IKEA,Na,38x51x30 cm,Na,0,,10,10,,Defence Colony,To be defined,Ok,,Storage
Na,Misc.,Storage,Desk Organiser White,IKEA,Na,25x20 cm,Na,0,,4,4,,Defence Colony,To be defined,Ok,,1 TLB + 1 Production extension + 2 first floor hall
Na,Furniture,Dining table,Zyle Dining Table,Na,Na,5.25'X2.5'X2.5',Na,0,,1,1,,Delhi Warehouse,To be defined,Ok,,Na
Na,Furniture,Board,Pegboard Combination White,Ikea,Na,56x56,Na,0,,6,6,,Defence Colony,To be defined,Ok,,Each Room
Na,Furniture,Shelf,Display Shelf White,Ikea,Na,60,Na,0,,4,4,,Defence Colony,To be defined,Ok,,MiNaal's Room
Na,Furniture,Desk,Desk White,Ikea,Na,160x80,Na,0,,2,2,,Defence Colony,To be defined,Ok,,First Floor Room
Na,Furniture,Drawer,Drawer Unit White,Ikea,Na,34x56,Na,0,,4,4,,Defence Colony,To be defined,Ok,,2 In production extension & 2 in first floor hall
Na,Furniture,Drawer,Drawer Unit 3 On Castors White,Ikea,Na,40x47x56,Na,0,,8,8,,Defence Colony,To be defined,Ok,,4 ground floor + 4 first floor
Na,Furniture,Table,Table Beige White,Ikea,Na,80x80,Na,0,,1,1,,Defence Colony,To be defined,Ok,,MiNaal's Room
Na,Furniture,Desk,Desk White 1,Ikea,Na,120x60,Na,0,,1,1,,Defence Colony,To be defined,Ok,,Tlb
Na,Furniture,Desk,Desk White 2,Ikea,Na,200x60,Na,0,,14,14,,Defence Colony,To be defined,Ok,,1 TLB + 4 production extended + 4 first floor hall + rest 6 TBD
Na,Furniture,Drawer,Desk White 3,Ikea,Na,140x60,Na,0,,3,3,,Defence Colony,To be defined,Ok,,2 fiNance + Neelangshu
Na,Furniture,Wall cabinet,Wall Cabinet White With 1 Shelf,Ikea,Na,60x32x60,Na,0,,5,5,,Defence Colony,To be defined,Ok,,FiNance
Na,Furniture,Table,Table White,Ikea,Na,100x60,Na,0,,7,7,,Defence Colony,To be defined,Ok,,First floor hall
Na,Furniture,Bookcase,Bookcase White,Ikea,Na,80x28x237,Na,0,,2,2,,Defence Colony,To be defined,Ok,,MiNaal's room
Na,Furniture,Cabinet combiNation,Cabinet Combination Grey,Ikea,Na,120x35x92,Na,0,,5,5,,Defence Colony,To be defined,Ok,,Smriti's room
Na,Furniture,Wall shelf,Wall Shelf White,Ikea,Na,120x30,Na,0,,2,2,,Defence Colony,To be defined,Ok,,MiNaal's room
Na,Furniture,Storage combiNation with doors,Storage Combination With Doors White,Ikea,Na,45x47x167,Na,0,,2,2,,Defence Colony,To be defined,Ok,,Production extension
Na,Furniture,Bookcase combiNation w glass doors,Bookcase Combination Glass Doors Oak Effect Clear Glass,Ikea,Na,120x30x202,Na,0,,1,1,,Defence Colony,To be defined,Ok,,MiNaal's room
Na,Furniture,High,High Rise Chair Barchair,Spin,Na,17X17X36,Na,0,,3,3,,Defence Colony,To be defined,Ok,,Production extension
Na,Furniture,Drawer,Ikea Drawer 2023 Skm Lounge,Ikea,Na,24X14X22,Na,0,,2,2,,Defence Colony,To be defined,Ok,,Tlb
Na,Furniture,Stool,Neo Mini Stool Black Stained Oakwood,Ikea,Na,12X18,Na,0,,1,1,,Defence Colony,To be defined,Ok,,Na
Na,Furniture,Stool,Sono Stool - Natural Oakwood,Ikea,Na,11X11X18,Na,0,,4,4,,Defence Colony,To be defined,Ok,,Na
Na,Furniture,Chair,Solimo Black Chair,Solimo,Na,20X16X31,Na,0,,6,6,,Defence Colony,To be defined,Ok,,Na
Na,Furniture,Chair,Ikea Black foldable Chair,Ikea,Na,15X13X30,Na,0,,5,5,,Defence Colony,To be defined,Ok,,Na
Na,Furniture,Beans,Bean Bags,Amozon,Na,Na,Na,0,,5,5,,Defence Colony,To be defined,Ok,,Na
Na,Furniture,Table,Ikea Black Table,Ikea,Na,39X24X29,Na,0,,5,5,,Defence Colony,To be defined,Ok,,Na
Na,Furniture,Trolley,Side Trolleys,Ikea,Na,14X10X31,Na,0,,2,2,,Defence Colony,To be defined,Ok,,Na
Na,Furniture,Couch,Arc Lounger,Spin,Na,7'X2.5'X2.5',Na,0,,1,1,,Defence Colony,To be defined,Ok,,Ok
Na,Furniture,Table,Red Desk,Spin,Na,5,Na,0,,1,1,,Defence Colony,To be defined,Ok,,Ok
Na,Furniture,Mudda,Jute Mudda 1,Na,Na,"16""X16""",Na,0,,4,4,,Delhi Warehouse,To be defined,Ok,,
Na,Furniture,Mudda,Jute Mudda 2,Na,Na,"13""X14""",Na,0,,6,6,,Delhi Warehouse,To be defined,Ok,,
Na,Furniture,Mudda,Jute Mudda 3,Na,Na,"15""x12""",Na,0,,5,5,,Delhi Warehouse,To be defined,Ok,,
Na,Furniture,Mudda,Jute Mudda 4,Na,Na,"13""X9""",Na,0,,2,2,,Delhi Warehouse,To be defined,Ok,,
Na,Lights,Lights,Spot Lamp,Bdcl,Na,Na,Na,0,,9,9,,Delhi Warehouse,To be defined,Bieng Check,,
Na,Lights,Lights,Spot Lamp,Bdcl,Na,Na,Na,0,,12,12,,Delhi Warehouse,To be defined,Bieng Check,,
Na,Lights,Lights,Sunglow Zoomable,Sunglow,Na,Na,Na,0,,21,21,,Delhi Warehouse,To be defined,Bieng Check,,
Na,Lights,Lights,Sunglow Framing,Sunglow,Na,Na,Na,0,,33,33,,Delhi Warehouse,To be defined,Bieng Check,,
Na,Lights,Lights,Spot Lamp,Bdcl,Na,Na,Na,0,,17,17,,Delhi Warehouse,To be defined,Bieng Check,,
Na,Lights,Lights,Small Lamp,Bdcl,Na,Na,Na,0,,19,19,,Delhi Warehouse,To be defined,Bieng Check,,
Na,Lights,Lights,Spot Lamp,Bdcl,Na,Na,Na,0,,15,15,,Delhi Warehouse,To be defined,Bieng Check,,
Na,Lights,Lights,Spot Lamp,Bdcl,Na,Na,Na,0,,15,15,,Delhi Warehouse,To be defined,Bieng Check,,
Na,Lights,Lights,Track Spot Light,Bdcl,Na,Na,Na,0,,55,55,,Delhi Warehouse,To be defined,Bieng Check,,
Na,Lights,Lights,Track Spot Light,Bdcl,Na,Na,Na,0,,55,55,,Delhi Warehouse,To be defined,Bieng Check,,
Na,Lights,Lights,Track Spot Light,Bdcl,Na,Na,Na,0,,55,55,,Delhi Warehouse,To be defined,Bieng Check,,
Na,Lights,Lights,Track Spot Light,Bdcl,Na,Na,Na,0,,55,55,,Delhi Warehouse,To be defined,Bieng Check,,
Na,Lights,Lights,Track Spot Light,Bdcl,Na,Na,Na,0,,55,55,,Delhi Warehouse,To be defined,Bieng Check,,
Na,Lights,Lights,Track Spot Light,Bdcl,Na,Na,Na,0,,12,12,,Delhi Warehouse,To be defined,Bieng Check,,
Na,Lights,Lights,Sunglow Framing,Sunglow,Na,Na,Na,0,,4,4,,Delhi Warehouse,To be defined,Bieng Check,,
Na,Lights,Lights,Sunglow Zoomable,Sunglow,Na,Na,Na,0,,7,7,,Delhi Warehouse,To be defined,Bieng Check,,
Na,Technical,Screen,Projection Screen,Na,Na,12.5'x7.5',Na,0,,1,1,,Delhi Warehouse,To be defined,Ok,,Not Ok
Na,Technical,Screen,Projection Screen,Na,Na,10'x6.5',Na,0,,2,2,,Delhi Warehouse,To be defined,Ok,,Not Ok
Na,Production,Tent,Tent Material,Na,Na,Na,Na,0,,5,5,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Tools,Ladder Self Standing,Na,Na,12',Na,0,,8,8,,Goa Warehouse,Zone I,Ok,,Ok
Na,Production,Tools,Ladder,Na,Na,12',Na,0,,1,1,,Goa Warehouse,Zone I,Ok,,Ok
Na,Production,Tools,Ladder Self Standing,Na,Na,10',Na,0,,10,10,,Goa Warehouse,Zone I,Ok,,Ok
Na,Production,Tools,Ladder Self Standing,Na,Na,8',Na,0,,7,7,,Goa Warehouse,Zone I,Ok,,Ok
Na,Production,Platform,G20 1,Na,Na,"3'X4'X4""",Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Platform,G20 2,Na,Na,3'X3'X3',Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Platform,G20 3,Na,Na,2'X2'X3',Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Platform,G20 4,Na,Na,"4'X4'X4""",Na,0,,2,2,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Platform,G20 5,Na,Na,"8'X5'X4""",Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Platform,G20 6,Na,Na,"8'X6'X4""",Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Platform,G20 7,Na,Na,8'X6'X6',Na,0,,6,6,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Platform,G20 8,Na,Na,4.7'X2'X1.5',Na,0,,6,6,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Platform,G20 9,Na,Na,4'X2'X2',Na,0,,6,6,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Platform,G20 10,Na,Na,"50""X36""X30""",Na,0,,2,2,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Platform,G20 11,Na,Na,4'X4'X5',Na,0,,3,3,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Platform,G20 12,Na,Na,4'X2'X1',Na,0,,3,3,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Platform,G20 13,Na,Na,8'X2.5'X2',Na,0,,3,3,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Platform,G20 14,Na,Na,"83""X36""X24""",Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Platform,G20 15,Na,Na,4'X2'X1.5',Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Platform,G20 16,Na,Na,7'X2'X1,Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Platform,G20 17,Na,Na,6'X3'X1,Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Platform,G20 18,Na,Na,"6.9'X1'X6""",Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Platform,G20 19,Na,Na,"10.9'X1'X6""",Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Platform,G20 20,Na,Na,"12'X3'X4""",Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,Box one side open 47,Na,Na,1'X1'X1',Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,Box one side white 21,Na,Na,1'X1'X1',Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Box 22,Na,Na,1'X1'X2.5',Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Box 23,Na,Na,1'X1'X3.5',Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Box 24,Na,Na,1'X1'X3',Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Box 25,Na,Na,1'X1'X1.5',Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Box 26,Na,Na,1.5'X1.5'X1',Na,0,,2,2,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Box 27,Na,Na,1.5'X1.5'X1.5',Na,0,,2,2,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Box 28,Na,Na,1.5'X1.5'X2',Na,0,,3,3,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Box 29,Na,Na,"2'X2'X6""",Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Cylinderical 30,Na,Na,"8""X1'",Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Cylinderical 31,Na,Na,"1.3'X6""",Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Cylinderical with stand 32,Na,Na,1.9'X2.5',Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 L Shaped 33,Na,Na,"1'X1'X4""",Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Box with Stand 34,Na,Na,1'X1'X5',Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Box 35,Na,Na,3'X3'X3',Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Box 36,Na,Na,"11""X11""X4""",Na,0,,3,3,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Box 37,Na,Na,"9""X9""X8""",Na,0,,5,5,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Box 38,Na,Na,"5""X5""X1'",Na,0,,6,6,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Box 39,Na,Na,8'X3'X4',Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Box 40,Na,Na,9'X2'X4',Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Branding,G20-41,Na,Na,1'X1.5'X7.10',Na,0,,5,5,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Stand,Easel Stand-5ft,Na,Na,"1'10"" Span | 5' height",Na,0,,49,49,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Stand,Tripod Metal Stand,Na,Na,3'span X 5' height,Na,0,,21,21,,Goa Warehouse,Zone I,Ok,,Ok
Na,Production,Misc.,Black Umbrella,Na,Na,6' (h) | 4' Span,Na,0,,2,2,,Goa Warehouse,Zone D,Ok,,Ok
Na,Production,Misc.,Black Umbrella base,Na,Na,Na,Na,0,,2,2,,Goa Warehouse,Zone D,Ok,,Ok
Na,Production,Misc.,White Umbrella,Na,Na,6' (h) | 4' Span,Na,0,,1,1,,Goa Warehouse,Zone D,Ok,,Ok
Na,Production,Misc.,Coat Stand,Na,Na,5',Na,0,,2,2,,Goa Warehouse,Zone D,Ok,,Ok
Na,Production,Branding,White Acrylic Self Standing Branding,Na,Na,"28""X12""",Na,0,,5,5,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,G20 Box 42,Na,Na,1.5'X1.5'X2',Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Box 43,Na,Na,1.5'X1.5'X1.5',Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Box 44,Na,Na,1.5'X1.5'X1',Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Box 45,Na,Na,2'X1'X1',Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Box 46,Na,Na,"5'X5'X8""",Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 Box 48,Na,Na,"1'X1'X4""",Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Pedestal,G20 49,Na,Na,1'X1',Na,0,,1,1,,Goa Warehouse,ZoneB,Ok,,Ok
Na,Production,Light Box,Prints,Na,Na,"47""X67""X7""",Na,0,,13,13,,Goa Warehouse,Zone B,Ok,,Ok
Na,Production,Stand,Angluar Stand 5ft,Na,Na,1.5'X1'X5',Na,0,,33,33,,Goa Warehouse,Zone D,Ok,,Ok
Na,Production,Stand,Rectangular Stand 6ft,Na,Na,2.3'X1'X6',Na,0,,3,3,,Goa Warehouse,Zone B,Ok,,Ok
Na,Production,Stand,Rectangular Stand 7.5ft,Na,Na,2.5'X1.4'X7.5',Na,0,,2,2,,Goa Warehouse,Zone B,Ok,,Ok
Na,Production,Pedestal,White pedestal 1,Na,Na,1'x1'x5',Na,0,,8,8,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,White pedestal 4,Na,Na,"1'6""x1'6"" x2'7""",Na,0,,3,3,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,White pedestal 5,Na,Na,1'x1'x3',Na,0,,2,2,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,White pedestal 6,Na,Na,"1'x1'x3'4""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,White pedestal 8,Na,Na,"1'9""x1'x3'6""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,White pedestal 14,Na,Na,"2'x1'6""x2'7""",Na,0,,2,2,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,White pedestal 15,Na,Na,"1'x1'x4'4""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,White pedestal 16,Na,Na,"11""x10""x4'",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,White pedestal 18,Na,Na,"1'x1'x2'7""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,White pedestal 19,Na,Na,1'x1'x2',Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,White pedestal 20,Na,Na,"1'3""x1'3""x3'2""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,White pedestal 21,Na,Na,"1'4""x1'4""x3'",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,White pedestal 23,Na,Na,"1'6""x1'6""x3'",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,White pedestal 24,Na,Na,2'x2'x2',Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,White pedestal 25,Na,Na,"2'4""x1'4""x3'",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,White pedestal 26,Na,Na,"3'x2'x2'6""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,White pedestal 27,Na,Na,"1'7""x1'7""x1'7""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,White pedestal 28,Na,Na,"1'6""x1'6""x1'",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,White pedestal 29,Na,Na,"1'8""x1'5""x6""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,White pedestal 30,Na,Na,"1'4""x1'x1'4""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,White pedestal 31,Na,Na,"1'7""x1'7""x6""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,White pedestal 32,Na,Na,"2'x1'8""x1'",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,White pedestal 33,Na,Na,3'x2'x1',Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,Black pedestal 2,Na,Na,"1'6""x1'6""x2'",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,Black pedestal 3,Na,Na,"1'x1'x6'8""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,Black pedestal 4,Na,Na,"1'6""x1'x4'",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,Black pedestal 5,Na,Na,"1'8""x1'2""x7'3""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,Black pedestal 6,Na,Na,"1'3""x1'3""x3'3""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,Black pedestal 7,Na,Na,"1'x1'x3'6""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,Black pedestal 8,Na,Na,"1'3""x1'3""x1'7""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,Black pedestal 9,Na,Na,"2'8""x1'5""x3'4""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,Purple pedestal,Na,Na,1'X2',Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,Chipboard pedestal,Na,Na,"1'x1'x3'4""",Na,0,,6,6,,Goa Warehouse,Zone I,Ok,,Ok
Na,Production,Display,White Table with Shelf,Na,Na,"11'9""x1'6""x2'10""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,Black pedestal with Storage 11,Na,Na,"1'6""x1'6""x3'3""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,Grey pedestal 1,Na,Na,"1'2""x1'2""x5'2""",Na,0,,3,3,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,Grey pedestal 2,Na,Na,"1'6""x1'6""x5'11""",Na,0,,1,1,,Goa Warehouse,,
Na,Production,Pedestal,Grey pedestal 3,Na,Na,"1'6""x1'6""x7'5""",Na,0,,1,1,,Goa Warehouse,,
Na,Production,Pedestal,Brown pedestal 1,Na,Na,"1'6""x1'6""x2'",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,Brown pedestal 2,Na,Na,"1'5""x1'5""x2'",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,Brown pedestal 3,Na,Na,"3'x2'x3'6""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Pedestal,Brown pedestal 4,Na,Na,1'x1'x4',Na,0,,6,6,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Cover,HS8S woofer cover,Na,Na,"1'5""x1'7x1'7""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Dropbox,Blue Dropbox,Na,Na,"1'3""x1'3""x3'",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Dropbox,White Dropbox,Na,Na,"1'6""x1'4""x2'3""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Steps,Brown steps,Na,Na,"4'5""x8""x8""",Na,0,,7,7,,Goa Warehouse,Zone A,Ok,,Ok
Na,Production,Misc.,White Bench/Pedestal,Na,Na,"3'x1'5""x1'5""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Ok
Na,Technical,Appliance,Chest Freezer,Lloyd,LHT250,2.8'X2'X3',RIICG30700351,0,,1,1,,Goa Warehouse,Zone G,Ok,,Visual checks
Na,Technical,Appliance,Chest Freezer,Lloyd,LHT250,2.8'X2'X3',RIICG30700012,0,,1,1,,Goa Warehouse,Zone G,Ok,,Visual checks
Na,Technical,Appliance,Chest Freezer,Lloyd,LHT250,2.8'X2'X3',RIICG30700357,0,,1,1,,Goa Warehouse,Zone G,Ok,,Visual checks
Na,Technical,Appliance,Chest Freezer,Lloyd,LHT250,2.8'X2'X3',RIICG30700307,0,,1,1,,Goa Warehouse,Zone G,Ok,,Visual checks
Na,Technical,Appliance,Chest Freezer,Lloyd,LHT250,2.8'X2'X3',RIICG30700015,0,,1,1,,Goa Warehouse,Zone G,Ok,,Visual checks
Na,Technical,Appliance,Chest Freezer,Lloyd,LHT250,2.8'X2'X3',RIICG30700179,0,,1,1,,Goa Warehouse,Zone G,Ok,,Visual checks
Na,Technical,Appliance,Chest Freezer,Lloyd,LHT250,2.8'X2'X3',RIICG30700011,0,,1,1,,Goa Warehouse,Zone G,Ok,,Visual checks
Na,Technical,Appliance,Chest Freezer,Lloyd,LHT250,2.8'X2'X3',RIICG30700186,0,,1,1,,Goa Warehouse,Zone G,Ok,,Visual checks
Na,Technical,Appliance,Chest Freezer,Lloyd,LHT250,2.8'X2'X3',RIICG30700034,0,,1,1,,Goa Warehouse,Zone G,Ok,,Visual checks
Na,Technical,Appliance,Chest Freezer,Lloyd,LHT250,2.8'X2'X3',RIICG30700180,0,,1,1,,Goa Warehouse,Zone G,Ok,,Visual checks
Na,Technical,Appliance,Chest Freezer,Lloyd,LHT250,2.8'X2'X3',RIICG30700172,0,,1,1,,Goa Warehouse,Zone G,Ok,,Visual checks
Na,Production,Table,L Table,Na,Na,5.1'X4.1X2.5',Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Stool,Kyrre Stool,Na,Na,"14""x14""x18""",Na,0,,6,6,,Delhi Warehouse,To be defined,Ok,,
Na,Furniture,Chair,Dinning Wooden Chair,Na,Na,"17""x16""x37""",Na,0,,2,2,,Delhi Warehouse,To be defined,Ok,,
Na,Furniture,Table,Wooden Planter Table,Na,Na,"16""x16x20""",Na,0,,1,1,,Delhi Warehouse,To be defined,Ok,,
Na,Furniture,Table,White Plastic Foldable Table,Na,Na,"60""x28""x29""",Na,0,,6,6,,Delhi Warehouse,To be defined,Ok,,
Na,Furniture,Board,BlackBoard,Na,Na,"48""x36""",Na,0,,2,2,,Delhi Warehouse,To be defined,Ok,,
Na,Furniture,Stool,Stool Pickle Shop 2024,Na,Na,"14""x12""x21""",Na,0,,8,8,,Delhi Warehouse,To be defined,Ok,,
Na,Furniture,Stool,Stool Shahi Tukda,Na,Na,"12""x12""x13""",Na,0,,1,1,,Delhi Warehouse,To be defined,Ok,,
Na,Furniture,Table,Picnic Table,Na,Na,"48""x24""x20""",Na,0,,5,5,,Delhi Warehouse,To be defined,Ok,,
Na,Furniture,Table,Panjim Market Table,Na,Na,"35""x24""x30""",Na,0,,9,9,,Delhi Warehouse,To be defined,Ok,,
Na,Furniture,Table,Table Pickle Shop 2024,Na,Na,"47""x31""x29""",Na,0,,1,1,,Delhi Warehouse,To be defined,Ok,,
Na,Furniture,Table,Wooden Dinning Table,Na,Na,"34""x34""x30""",Na,0,,1,1,,Delhi Warehouse,To be defined,Ok,,
Na,Furniture,Chair,Black Cushioned Chair Conference,Na,Na,"18""x18""x30""",Na,0,,24,24,,Delhi Warehouse,To be defined,Ok,,
Na,Furniture,Bench,Wooden Bench Big 6,Na,Na,"39""x12""x16""",Na,0,,7,7,,Delhi Warehouse,To be defined,Ok,,
Na,Furniture,Stool,Cushioned Stool,Na,Na,"18""x13""x20""",Na,0,,2,2,,Delhi Warehouse,To be defined,Ok,,
Na,Furniture,Side Table,SKM Lounge 2024,Na,Na,Na,Na,0,,1,1,,Delhi Warehouse,To be defined,Ok,,
Na,Furniture,Stool,Foldable Plastic Stool,Na,Na,"15""x13""x18""",Na,0,,6,6,,Delhi Warehouse,To be defined,Ok,,
Na,Furniture,Stool,Stool 1,Na,Na,1'X1'X1.5',Na,0,,3,3,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Stool,Stool 2,Na,Na,"2'x2'x3'8""",Na,0,,2,2,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Stool,Stool 3,Na,Na,"2'x2'x2'8""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Stool,Stool 4,Na,Na,2'x2'x3',Na,0,,2,2,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Stool,Stool 5,Na,Na,"1'9""x2'x2'4""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Stool,Stool 6,Na,Na,"2'6""x1'5""x1'8""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Stool,Stool 7,Na,Na,"1'x1'x1'2""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Stool,Stool 9,Na,Na,"2'x2'x2'6""",Na,0,,2,2,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Stool,High Stool 1,Na,Na,"1'7""x1'x2'8""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Stool,High Stool 2,Na,Na,"1'5""x1'5""x3'",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Stool,High Stool 3,Na,Na,1'x1'x3',Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Stool,High Stool 5,Na,Na,"1'5""x2'x4'3""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Stool,High Stool 6,Na,Na,"1'3""x1'3""x2'3""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Stool,High Stool 7,Na,Na,"1'3""x1'3""x2'11""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Stool,Stool Blue,Na,Na,"1'2""x1'2""x2'",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Stool,Stool white 1,Na,Na,"1'5""x2'",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Stool,Stool white 2,Na,Na,"1'5""x1'6""",Na,0,,2,2,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Stool,Stool Brown,Na,Na,1'x1'x3',Na,0,,2,2,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Chair,Refree Chair,Na,Na,2'x2'x6',Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Misc.,Water Tank,Syntax,Na,1000,Na,0,,1,1,,Goa Warehouse,Zone E,Ok,,Visual checks
Na,Furniture,Misc.,Half Mannequinn - Male,Na,Na,Na,Na,0,,1,1,,Goa Warehouse,Zone E,Ok,,Visual checks
Na,Furniture,Misc.,Half Mannequinn - Female,Na,Na,Na,Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Table,Table White,Na,Na,"3'x1'5""x1'8""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Table,Table White,Na,Na,"4'x2'x2'10""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Table,Table White,Na,Na,"4'6""x2'x2'6""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Stool,Stool with white legs 1,Na,Na,"1'2""x1'2""x3'2""",Na,0,,8,8,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Stool,Stool with white legs 2,Na,Na,"2'x2'x1'8""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Production,Display,AKFD shelves,Na,Na,"4'X6""(d)X5.9'",Na,0,,4,4,,Goa Warehouse,Zone A,Not Ok,,Need to refurbish
Na,Production,Storage,Shelves,Na,Na,3.9'X1.2'X5.9',Na,0,,1,1,,Defence Colony,Zone A,Ok,,Visual checks
Na,Furniture,Bench,Bench with black legs,Na,Na,"7'x3'x1'8""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Bench,Bench with black legs,Na,Na,"6'x1'6""x1'6""",Na,0,,2,2,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Bench,Bench with black legs,Na,Na,"4'x1'5""x1'6""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Bench,Bench with black legs,Na,Na,"4'x1'5""x1'6""",Na,0,,15,15,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Bench,Bench with black legs,Na,Na,"6'x1'6""x1'6""",Na,0,,4,4,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Bench,Bench with black legs,Na,Na,"7'x1'6""x1'7""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks|Black Painted
Na,Furniture,Bench,Bench with black legs,Na,Na,"10'x1'6""x1'9""",Na,0,,2,2,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Bench,Bench with black legs,Na,Na,"6'x1'6""x1'8""",Na,0,,3,3,,Goa Warehouse,Zone A,Ok,,Visual checks| 1 Black Painted
Na,Furniture,Bench,Bench with black legs,Na,Na,"8'x1'5""x1'8""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Bench,Bench with black legs,Na,Na,"3'6""x1'6""x1'8""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Table,High Table,Na,Na,4'x2'x3',Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Table,High Table,Na,Na,"1'8""x1'8""x3'",Na,0,,3,3,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Table,High Table beige color with white legs,Na,Na,"3'x1'6""x2'9""",Na,0,,3,3,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Table,High Table beige color with white legs,Na,Na,"3'x1'7""x2'7""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Table,High Table beige color with white legs,Na,Na,"4'x2'x2'7""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Table,High Table beige color with white legs,Na,Na,"4'x2'3""x2'7""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Table,High Table beige color with white legs,Na,Na,"3'10""x1'5""x3'2""",Na,0,,2,2,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Table,High Table beige color with white legs,Na,Na,"2'x1'x2'2""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Table,High Table beige color with white legs,Na,Na,"4'4""x1'10""x2'8""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Table,High Table beige color with white legs,Na,Na,"3'x1'6""x2'10""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Table,Table,Na,Na,"5'x2'x2'6""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Table,Table,Na,Na,"6'x2'x2'6""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Table,Table,Na,Na,"5'x2'x2'9""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Table,Table,Na,Na,"5'x2'x3'6""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Table,Display Table,Na,Na,"4'x1'3""x2'",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Table,Table Beige with White legs,Na,Na,"3'x2'x2'2""",Na,0,,6,6,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Table,Table Beige with White legs,Na,Na,"3'x1'6""x2'9""",Na,0,,5,5,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Bench,Bench,Na,Na,"6'6""x2'6""x1'",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Bench,Bench,Na,Na,"4'4""x2'4""x1'",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Bench,Chipboard Bench,Na,Na,"4'x2'x1'7""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Bench,Chipboard Bench,Na,Na,3'x1'x2',Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,in camera room
Na,Furniture,Bench,Bench Beige with white legs,Na,Na,"4'x1'x1'5""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Bench,Bench Beige with white legs,Na,Na,"3'x1'x1'7""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Table,Black Extendable Table,Na,Na,"4'x2'6""x2""5'",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Table,Table - Mango Wood/Damaged,Na,Na,"5'x2'x2'6""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Furniture,Chair,Black Foldable Chairs,Na,Na,Na,Na,0,,264,264,,Goa Warehouse,Zone H,Ok,,Visual checks
Na,Production,Pedestal,Customized pedestal,Na,Na,"1'4""x1'4""x4'7""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Production,Pedestal,Customized pedestal,Na,Na,"1'6""x1'6""x4'7""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Production,Pedestal,Customized pedestal,Na,Na,1'x1'x4',Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Production,Pedestal,Customized pedestal,Na,Na,"1'6""x1'6""x4'5""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Production,Pedestal,Customized pedestal,Na,Na,"1'2""x1'2""x4'4""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Production,Pedestal,Customized pedestal,Na,Na,"1'x1'x3'10""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Production,Pedestal,Customized pedestal,Na,Na,"1'x1'x4'4""",Na,0,,2,2,,Goa Warehouse,Zone A,Ok,,Visual checks
Na,Production,Accessability,Wheel Chair,Na,Na,Na,Na,0,,13,13,,Goa Warehouse,Zone B,Bad,,Bad Seats & Mechanism
Na,Production,Misc.,Mirror black frame,Na,Na,4'x6',Na,0,,1,1,,Goa Warehouse,Zone G,Ok,,Na
Na,Production,Misc.,Black Rectangular metal pipes,Na,Na,4',Na,0,,9,9,,Goa Warehouse,Zone G,Ok,,Used for projector mounting
Na,Production,Misc.,Black L shaped metal pipes,Na,Na,4',Na,0,,1,1,,Goa Warehouse,Zone G,Ok,,Used for projector mounting
Na,Production,Misc.,Black L shaped metal pipes,Na,Na,"2'6""",Na,0,,2,2,,Goa Warehouse,Zone G,Ok,,Used for projector mounting
Na,Production,Misc.,Black Support metal pipes,Na,Na,"1'1""",Na,0,,33,33,,Goa Warehouse,Zone G,Ok,,Used for projector mounting
Na,Production,Misc.,Clear Shed,Na,Na,"8'x3'4""",Na,0,,3,3,,Goa Warehouse,Zone A,Ok,,Used for projector mounting
Na,Production,Misc.,Shop Display Shelf,Na,Na,"8'x2'x8'8""",Na,0,,2,2,,Goa Warehouse,Zone B,Ok,,Used for projector mounting
Na,Production,Misc.,Metal Mesh,Na,Na,14'X3',Na,0,,5,5,,Goa Warehouse,Zone A,Ok,,
Na,Production,Panels,Panels with Cavity for display,Na,Na,"7'9"" x1'x6'7""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,
Na,Production,Panels,Panels with Cavity for display,Na,Na,"7'9""x 1'x8'6""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,
Na,Production,Panels,Panels with Cavity for display,Na,Na,"7'7""X10""x7'10""",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,
Na,Furniture,Table,Food Lab Table,Na,Na,10'x1'x3',Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Refurbishment required
Na,Furniture,Table,Food Lab Table,Na,Na,"15'x1'7""x2'9""",Na,0,,5,5,,Goa Warehouse,Zone A,Ok,,Refurbishment required
Na,Furniture,Table,Food Lab Table,Na,Na,8'x4'x3',Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Refurbishment required
Na,Production,Misc.,Clothes Rack,Na,Na,Standard,Na,0,,9,9,,Goa Warehouse,Zone D,Ok,,Na
Na,Furniture,Chair,White chairs,Ikea,Na,Standard,Na,0,,48,48,,Goa Warehouse,Zone H,Ok,,Na
Na,Furniture,Chair,White Stools,Ikea,Na,Standard,Na,0,,34,34,,Goa Warehouse,Zone H,Ok,,Na
Na,Furniture,Chair,Bamboo Foldable Chair,Local,Na,Standard,Na,0,,5,5,,Goa Warehouse,Zone A,Ok,,Na
Na,Furniture,Chair,Ghost Chair,Na,Na,Na,Na,0,,1,1,,Goa Warehouse,Zone H,Ok,,Na
Na,Furniture,Chair,White Poufs buttoned,Na,Na,"1'x1'x1'3""",Na,0,,1,1,,Goa Warehouse,Zone I,Ok,,Na
Na,Furniture,Table,T table/Damaged,Na,Na,"4'7"" x2'7""x2'7""",Na,0,,1,1,,Goa Warehouse,Zone E,Ok,,Na
Na,Production,Misc.,Black Boards,Na,Na,2'X3',Na,0,,7,7,,Goa Warehouse,Zone D,Ok,,Na
Na,Production,Misc.,Text Matter Boards,Na,Na,"4'8""X1'7""X8",Na,0,,5,5,,Goa Warehouse,Zone F,Ok,,Na
Na,Production,Display,Shelf White 1,Na,Na,"6'x1'2""5'10""",Na,0,,3,3,,Goa Warehouse,Zone F,Ok,,Damaged
Na,Production,Display,Shelf White 2,Na,Na,"3'x1'5""x6""",Na,0,,1,1,,Goa Warehouse,Zone F,Ok,,Na
Na,Production,Display,Shelf White,Na,Na,"4'x1'x3""",Na,0,,1,1,,Goa Warehouse,Zone F,Ok,,Na
Na,Production,Display,Shelf Brown,Na,Na,"2'x1'6""x1'",Na,0,,1,1,,Goa Warehouse,Zone F,Ok,,Na
Na,Production,Display,Shelf Black,Na,Na,"1'3""x1'2""x10""",Na,0,,1,1,,Goa Warehouse,Zone F,Ok,,Na
Na,Production,Display,Book Shelf Bookworm,Na,Na,3' x1'x5',Na,0,,4,4,,Goa Warehouse,Zone F,Ok,,Na
Na,Production,Display,Mercad Shelf,Na,Na,2'x1'x7',Na,0,,29,29,,Goa Warehouse,Zone F,Ok,,Na
Na,Production,Display,Suggestion Box,Na,Na,"1'5""x1'5""x1'5""",Na,0,,1,1,,Goa Warehouse,Zone F,Ok,,Na
Na,Production,Display,Chipboard High Table,Na,Na,5'x1'x3',Na,0,,1,1,,Goa Warehouse,Zone F,Ok,,Na
Na,Production,Display,Brown Vitrine,Na,Na,"2'6""2'8""x4'",Na,0,,1,1,,Delhi Warehouse,Zone A,Ok,,Na
Na,Production,Display,Brown Vitrine,Na,Na,"4'x2'x3'10""",Na,0,,1,1,,Delhi Warehouse,Zone A,Ok,,Na
Na,Production,Display,White Vitrine 1,Na,Na,"3 'x2'x2'6""",Na,0,,4,4,,Goa Warehouse,Zone A,Ok,,Na
Na,Production,Display,White Vitrine (light Box) 2,Na,Na,"8' x2'8""x3'",Na,0,,1,1,,Goa Warehouse,Zone C,Ok,,Na
Na,Production,Display,White Vitrine (light Box) 3,Na,Na,"5'11""x3'x2'10""",Na,0,,2,2,,Goa Warehouse,Zone C,Ok,,Na
Na,Production,Display,White Vitrine (light Box) - without legs 4,Na,Na,"6'4""x1'6""x6""",Na,0,,1,1,,Goa Warehouse,Zone C,Ok,,Na
Na,Production,Display,White Vitrine (light Box) - without legs 5,Na,Na,"5'x1'6""x5""",Na,0,,1,1,,Goa Warehouse,Zone C,Ok,,Na
Na,Production,Display,White Vitrine (light Box) 6,Na,Na,"6'x1'2""x4""",Na,0,,1,1,,Goa Warehouse,Zone C,Ok,,Na
Na,Production,Display,White Vitrine (light Box) 7,Na,Na,"5'x1'6""x5""",Na,0,,4,4,,Goa Warehouse,Zone C,Ok,,Na
Na,Production,Display,White Vitrine (light Box) 8,Na,Na,"7'x2'x5""",Na,0,,1,1,,Goa Warehouse,Zone C,Ok,,Na
Na,Production,Display,White Vitrine (light BoX),Na,Na,"13'5""x3'x2'2""",Na,0,,1,1,,Goa Warehouse,Zone C,Ok,,Na
Na,Production,Display,Green Vitrine (light Box),Na,Na,"5'9""x1'3""x4""",Na,0,,1,1,,Goa Warehouse,Zone F,Ok,,Na
Na,Production,Display,Green curved table,Na,Na,6'x2'x3',Na,0,,1,1,,Goa Warehouse,Zone G,Ok,,Na
Na,Production,Display,Brown table/not repairble,Na,Na,"3'3""x1'9""x3'",Na,0,,1,1,,Goa Warehouse,Zone A,Ok,,Na
Na,Production,Frame,Black Iron Frame,Na,Na,"1'9""x2'7""x6'4""",Na,0,,1,1,,Goa Warehouse,Zone C,Ok,,Na
Na,Production,Frame,White Iron Frame,Na,Na,Na,Na,0,,10,10,,Goa Warehouse,Zone C,Ok,,Na
Na,Production,Frame,White Iron Frame,Na,Na,"2'x1'8""x2'4""",Na,0,,1,1,,Goa Warehouse,Zone C,Ok,,Na
Na,Production,Frame,A Stands Metal,Na,Na,"3'x2'x4'10""",Na,0,,30,30,,Goa Warehouse,Zone C,Ok,,Na
Na,Production,Frame,Black Stands,Na,Na,"2'x2'x5'4""",Na,0,,2,2,,Goa Warehouse,Zone A,Ok,,Na
Na,Production,Frame,Grey Iron Frames,Na,Na,"2'x1'6""x3'",Na,0,,8,8,,Goa Warehouse,Zone A,Ok,,Na
Na,Production,Frame,White Iron Frames,Na,Na,"3'10x1'5""x3'3""",Na,0,,3,3,,Goa Warehouse,Zone A,Ok,,Na
Na,Production,Frame,White Iron Frames,Na,Na,"4'x1'6""x2'",Na,0,,5,5,,Goa Warehouse,Zone A,Ok,,Na
Na,Production,Stand,Black Iron Stands,Na,Na,"10""x8""x5'",Na,0,,8,8,,Goa Warehouse,Zone A,Ok,,Na
Na,Production,Stand,Black Iron Stands with triangular base,Na,Na,"1'x1'2""x4'7""",Na,0,,4,4,,Goa Warehouse,Zone A,Ok,,Na
Na,Production,Stand,Black Iron Frames,Na,Na,"2'6""x1'x2'",Na,0,,5,5,,Goa Warehouse,Zone A,Ok,,Na
Na,Furniture,Table,Side Table,Na,Na,"1'5""x1'5""x2'3""",Na,0,,1,1,,Goa Warehouse,Zone G,Ok,,Refurbishment required
Na,Production,Stand,Base for Projectors,Na,Na,Na,Na,0,,47,47,,Goa Warehouse,Zone G,Ok,,Na
Na,Production,Stand,Base for Projectors with Claw,Na,Na,Na,Na,0,,47,47,,Goa Warehouse,Zone G,Ok,,Na
Na,Technical,Appliance,Tower AC - Outdoor Unit,Lloyd,GLT24B22MT,85.0 cm x 31.0 cm x 68.4 cm,87IJG03S01044,0,,1,1,,Goa Warehouse,Zone G,Ok,,`;

// Simple CSV parser supporting quotes
function parseCSV(text: string) {
  const lines = text.trim().split('\n');
  const result: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let insideQuote = false;
    let entry = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuote && line[i + 1] === '"') {
          entry += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        row.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());
    result.push(row);
  }

  return result;
}

async function main() {
  console.log('Starting Production Inventory CSV Import...');

  const activeEvent =
    (await prisma.event.findFirst({ where: { status: 'Active' } })) ||
    (await prisma.event.findFirst());

  const rows = parseCSV(csvRaw);
  const dataRows = rows.slice(1);

  console.log(`Found ${dataRows.length} item rows in CSV.`);

  // Delete prior PRODUCTION items to ensure clean import
  const deleted = await prisma.inventoryItem.deleteMany({
    where: { inventoryUsageType: 'PRODUCTION' },
  });
  console.log(`Cleared ${deleted.count} existing PRODUCTION items.`);

  const itemsToCreate = [];
  let seq = 1;

  for (const row of dataRows) {
    if (row.length < 4) continue;

    const safCodeRaw = row[0];
    const category = row[1] || 'Production';
    const subCategory = row[2] || 'General';
    const element = row[3] || 'Production Item';
    const brand = row[4] && row[4] !== 'Na' ? row[4] : null;
    const model = row[5] && row[5] !== 'Na' ? row[5] : null;
    const sizeLwh = row[6] && row[6] !== 'Na' ? row[6] : null;
    const serialNo = row[7] && row[7] !== 'Na' ? row[7] : null;
    
    // Quantity parsing
    const rawTotalQty = row[11] || row[10] || '1';
    let totalQty = parseInt(rawTotalQty.replace(/[^0-9]/g, ''), 10);
    if (isNaN(totalQty) || totalQty <= 0) totalQty = 1;

    const location = row[13] && row[13] !== 'Na' ? row[13] : 'Central Warehouse';
    const zone = row[14] && row[14] !== 'Na' ? row[14] : '';
    const condition = row[15] && row[15] !== 'Na' ? row[15] : 'Ok';
    const remarks = row[17] && row[17] !== 'Na' ? row[17] : '';

    const formattedLocation = zone ? `${location} (${zone})` : location;
    const safCode = safCodeRaw && safCodeRaw !== 'Na' ? safCodeRaw : `PROD-${String(seq).padStart(3, '0')}`;
    seq++;

    itemsToCreate.push({
      eventId: activeEvent?.id || null,
      safCode,
      inventoryCategory: category,
      subCategory,
      element,
      brandProject: brand,
      model,
      sizeLwh,
      serialNo,
      uom: 'Nos',
      totalQuantity: totalQty,
      availableQuantity: totalQty,
      reservedQuantity: 0,
      allocatedQuantity: 0,
      damagedQuantity: 0,
      maintenanceQuantity: 0,
      location: formattedLocation,
      condition,
      remarks,
      inventoryUsageType: 'PRODUCTION',
      inventorySource: 'Owned',
      ownershipType: 'SAF',
      inventoryStatus: 'Available',
    });
  }

  const result = await prisma.inventoryItem.createMany({
    data: itemsToCreate,
  });

  console.log(`Successfully batch inserted ${result.count} items into Production Team Table!`);
}

main()
  .catch((e) => {
    console.error('Error importing production CSV:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
