---
title: "Let your lambda within a VPC access Internet"
date: "2018-01-17T21:20:33.192Z"
layout: post
path: "/let-lambda-within-vpc-access-internet/"
categories:
  - AWS
  - Lambda
  - VPC
---
Surely when you see the title you'll probably wonder: *"Hmmm... my lambda can access Internet without a problem. What the heck are you talk about?"*. Well, when you provision an AWS lambda, you can choose a VPC, and if you do that, then you need to configure your VPC properly otherwise the lambda will lose Internet access.

Hold on a second, why do we want lambda to reside in a VPC? A classic example would be: what if you want your lambda to read data from a Redis cluster? This, is when you need VPC, otherwise there's no way for your lambda to access Redis. Alright, I'm writing this blog because today I had this problem that my lambda within VPC couldn't access the Internet. It took me a while to figure out why. In fact, I should've followed the official documentation in the first place, which would've saved me a lot time. But anyway, let's have a look how to do it.

<!--more-->

## Background story
Let's assume your VPC CIDR is `10.60.0.0/16` and you have two public subnets:
- **subnet1**: `10.60.1.0/24`
- **subnet2**: `10.60.2.0/24`.

Also, you have depoyed a Redis cluster across these two subnets, which means the nodes of the cluster are deployed across these two subnets. Alright, now we want to deploy a lambda in this VPC, and allow it to access the Redis and the Internet. So what should we do?

## Create a lambda
I assume you've got some experience using lambda, so I'm not gonna show you how to create lambda. A good practice is to provision it by CloudFormation, and the easiest way is to login AWS console and click a bunch of things to make it work. When you create the lambda, make sure you scroll down to *Configuration* section and choose VPC `10.60.0.0/16`. Then you'll be asked to choose subnets, just choose both of them (**subnet1** and **subnet2**). By doing this, you can imagine that AWS will provision your lambda on containers running within these subnets.

## Security group for Redis
Redis runs on TCP 6379, so the first thing we need to do is to create a RedisSecurityGroup:
- VPC: `10.60.0.0/16`
- Inbound: `Allow TCP 6379 from 10.60.0/0/16`

Attach this security group to both your lambda and Redis cluster. This esures that they can communicate with each other within VPC.

## Check your route table
By now, you subnets `10.60.1.0/24` and `10.60.2.0/24` should be associated with a route table which has these routes like this:

Destination | Target
--- | --- | ---
10.60.0.0/16 | local
0.0.0.0/0 | igw-1234567

This route table ensures that outgoing traffic will go through Internet gateway and eventually reach the Internet. Now if you think about it, by this logic, lambda should be able to access the Internet already. Well, unfortunately, our lambda doesn't have public IP yet, which prevents the Internet access.

## Add NAT gateway
To give the lambda a public IP, we need a NAT instance or gateway. AWS recommends us to use NAT gateway as it's managed service. So let's create a third **subnet3** in AZ3 (it doesn't have to be in AZ3 though; any AZ is fine): `10.60.3.0/24`. Then go to VPC service page and create a NAT gateway in this subnet. Add a route table for this subnet with routes like this:

Destination | Target
--- | --- | ---
10.60.0.0/16 | local
0.0.0.0/0 | igw-1234567

## Change routes for subnet1 and subnet2
Suppose your NAT gateway ID is nat-7654321. Now change the route table for **subnet1** and **subnet2**:

Destination | Target
--- | --- | ---
10.60.0.0/16 | local
0.0.0.0/0 | nat-7654321

There you go, now your routes work like this: *subnet1/2 -> nat-7654321 -> igw-1234567*.

## Conclusion
There seems to be a lot steps to get this working, but it's actually not that hard. What we did here is create a public subnet - **subnet3** where we put a NAT gateway. This public subnet is responsible for all the outgoing traffic to access the Internet. In the meantime, we made **subnet1** and **subnet2** private by removing the route `0.0.0.0/0 -> igw-1234567`. Instead, we re-route all the outgoing traffic to the NAT gateway residing in **subnet3**. Because **subnet3** has the route to access the Internet, the lambda in **subnet1** and **subnet2** will eventually have their access to Internet. Easy, right?
